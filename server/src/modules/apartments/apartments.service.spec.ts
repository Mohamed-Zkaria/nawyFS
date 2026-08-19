import { ApartmentsService } from '@/modules/apartments/apartments.service';
import { ApartmentMapper } from '@/modules/apartments/mappers/apartment.mapper';
import { InMemoryApartmentRepository } from '@/modules/apartments/repositories/in-memory-apartment.repository';
import { InMemoryProjectRepository } from '@/modules/projects/repositories/in-memory-project.repository';
import { ApartmentSortBy } from '@/modules/apartments/dto/query-apartments.dto';
import { QueryApartmentsDto } from '@/modules/apartments/dto/query-apartments.dto';
import { CreateApartmentDto } from '@/modules/apartments/dto/create-apartment.dto';
import {
  ApartmentImageNotFoundException,
  ApartmentNotFoundException,
  ProjectNotFoundException,
} from '@/common/exceptions/domain.exceptions';
import {
  createProject,
  resetProjectFactory,
} from '@/modules/projects/test/project.factory';
import {
  createApartment,
  resetApartmentFactory,
} from '@/modules/apartments/test/apartment.factory';

function query(
  overrides: Partial<QueryApartmentsDto> = {},
): QueryApartmentsDto {
  const dto = new QueryApartmentsDto();
  dto.page = overrides.page ?? 1;
  dto.limit = overrides.limit ?? 12;
  dto.sortBy = overrides.sortBy ?? ApartmentSortBy.CREATED_AT;
  dto.sortOrder = overrides.sortOrder ?? 'DESC';
  return Object.assign(dto, overrides);
}

function createDto(
  overrides: Partial<CreateApartmentDto> = {},
): CreateApartmentDto {
  const dto = new CreateApartmentDto();
  dto.unitName = overrides.unitName ?? 'Test Unit';
  dto.unitNumber = overrides.unitNumber ?? 'A-1';
  dto.price = overrides.price ?? 1000000;
  dto.bedrooms = overrides.bedrooms ?? 2;
  dto.bathrooms = overrides.bathrooms ?? 1;
  dto.areaSqm = overrides.areaSqm ?? 90;
  return Object.assign(dto, overrides);
}

describe('ApartmentsService', () => {
  let repo: InMemoryApartmentRepository;
  let projectRepo: InMemoryProjectRepository;
  let service: ApartmentsService;

  beforeEach(() => {
    resetProjectFactory();
    resetApartmentFactory();
    repo = new InMemoryApartmentRepository();
    projectRepo = new InMemoryProjectRepository();
    service = new ApartmentsService(repo, projectRepo, new ApartmentMapper());
  });

  it('paginates results and reports correct meta', async () => {
    const project = createProject();
    repo.seed(Array.from({ length: 15 }, () => createApartment(project)));

    const result = await service.findPaginated(query({ page: 2, limit: 10 }));

    expect(result.data).toHaveLength(5);
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 15,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('filters by projectId', async () => {
    const projectA = createProject({ name: 'Project A' });
    const projectB = createProject({ name: 'Project B' });
    repo.seed([createApartment(projectA), createApartment(projectB)]);

    const result = await service.findPaginated(
      query({ projectId: projectA.id }),
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].projectId).toBe(projectA.id);
  });

  it('composes filters together (bedrooms + price range)', async () => {
    const project = createProject();
    repo.seed([
      createApartment(project, { bedrooms: 2, price: '1000000.00' }),
      createApartment(project, { bedrooms: 3, price: '1500000.00' }),
      createApartment(project, { bedrooms: 3, price: '5000000.00' }),
    ]);

    const result = await service.findPaginated(
      query({ bedrooms: 3, minPrice: 1000000, maxPrice: 2000000 }),
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].price).toBe('1500000.00');
  });

  it('throws ApartmentNotFoundException for a missing id', async () => {
    await expect(service.findById('missing-id')).rejects.toBeInstanceOf(
      ApartmentNotFoundException,
    );
  });

  it('returns the mapped detail for an existing apartment', async () => {
    const project = createProject();
    const apartment = createApartment(project);
    repo.seed([apartment]);

    const detail = await service.findById(apartment.id);

    expect(detail.id).toBe(apartment.id);
    expect(detail.projectName).toBe(project.name);
  });

  describe('create', () => {
    it('creates an apartment under an existing project by projectId', async () => {
      const project = createProject();
      projectRepo.seed([project]);

      const detail = await service.create(
        createDto({ projectId: project.id, unitNumber: 'A-1' }),
      );

      expect(detail.projectId).toBe(project.id);
      expect(detail.unitNumber).toBe('A-1');
    });

    it('throws ProjectNotFoundException for an unknown projectId', async () => {
      await expect(
        service.create(createDto({ projectId: 'missing-project' })),
      ).rejects.toBeInstanceOf(ProjectNotFoundException);
    });

    it('auto-creates a project when only projectName is given', async () => {
      const detail = await service.create(
        createDto({ projectName: 'Brand New Project', projectCity: 'Cairo' }),
      );

      const projects = await projectRepo.findAll();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Brand New Project');
      expect(projects[0].slug).toBe('brand-new-project');
      expect(detail.projectId).toBe(projects[0].id);
    });

    it('reuses an existing project when projectName matches one already there', async () => {
      const project = createProject({ name: 'Existing Project' });
      projectRepo.seed([project]);

      await service.create(
        createDto({ projectName: 'Existing Project', projectCity: 'Cairo' }),
      );

      const projects = await projectRepo.findAll();
      expect(projects).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('patches only the fields provided, leaving the rest untouched', async () => {
      const project = createProject();
      const apartment = createApartment(project, {
        unitName: 'Original Name',
        bedrooms: 2,
      });
      repo.seed([apartment]);

      const detail = await service.update(apartment.id, { bedrooms: 4 });

      expect(detail.bedrooms).toBe(4);
      expect(detail.unitName).toBe('Original Name');
    });

    it('throws ApartmentNotFoundException for a missing id', async () => {
      await expect(
        service.update('missing-id', { bedrooms: 3 }),
      ).rejects.toBeInstanceOf(ApartmentNotFoundException);
    });

    it('moves the apartment to a different existing project by projectId', async () => {
      const projectA = createProject({ name: 'Project A' });
      const projectB = createProject({ name: 'Project B' });
      projectRepo.seed([projectA, projectB]);
      const apartment = createApartment(projectA);
      repo.seed([apartment]);

      const detail = await service.update(apartment.id, {
        projectId: projectB.id,
      });

      expect(detail.projectId).toBe(projectB.id);
    });

    it('throws ProjectNotFoundException for an unknown projectId', async () => {
      const project = createProject();
      const apartment = createApartment(project);
      repo.seed([apartment]);

      await expect(
        service.update(apartment.id, { projectId: 'missing-project' }),
      ).rejects.toBeInstanceOf(ProjectNotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes so the apartment no longer resolves', async () => {
      const project = createProject();
      const apartment = createApartment(project);
      repo.seed([apartment]);

      await service.remove(apartment.id);

      await expect(service.findById(apartment.id)).rejects.toBeInstanceOf(
        ApartmentNotFoundException,
      );
    });

    it('throws ApartmentNotFoundException for a missing id', async () => {
      await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
        ApartmentNotFoundException,
      );
    });
  });

  describe('images', () => {
    it('adds images in order, appending after any existing sort_order', async () => {
      const project = createProject();
      const apartment = createApartment(project);
      repo.seed([apartment]);

      const first = await service.addImages(apartment.id, {
        urls: ['https://cdn.example.com/a.jpg'],
      });
      expect(first).toEqual([
        {
          id: expect.any(String),
          url: 'https://cdn.example.com/a.jpg',
          sortOrder: 0,
        },
      ]);

      const second = await service.addImages(apartment.id, {
        urls: [
          'https://cdn.example.com/b.jpg',
          'https://cdn.example.com/c.jpg',
        ],
      });
      expect(second.map((image) => image.sortOrder)).toEqual([1, 2]);
    });

    it('throws ApartmentNotFoundException when adding images to a missing apartment', async () => {
      await expect(
        service.addImages('missing-id', {
          urls: ['https://cdn.example.com/a.jpg'],
        }),
      ).rejects.toBeInstanceOf(ApartmentNotFoundException);
    });

    it('removes an image scoped to its apartment', async () => {
      const project = createProject();
      const apartment = createApartment(project);
      repo.seed([apartment]);
      const [image] = await service.addImages(apartment.id, {
        urls: ['https://cdn.example.com/a.jpg'],
      });

      await service.removeImage(apartment.id, image.id);

      const detail = await service.findById(apartment.id);
      expect(detail.images).toHaveLength(0);
    });

    it('throws ApartmentImageNotFoundException for an unknown image id', async () => {
      const project = createProject();
      const apartment = createApartment(project);
      repo.seed([apartment]);

      await expect(
        service.removeImage(apartment.id, 'missing-image'),
      ).rejects.toBeInstanceOf(ApartmentImageNotFoundException);
    });

    it('throws ApartmentImageNotFoundException when the image belongs to a different apartment', async () => {
      const project = createProject();
      const apartmentA = createApartment(project);
      const apartmentB = createApartment(project);
      repo.seed([apartmentA, apartmentB]);
      const [image] = await service.addImages(apartmentA.id, {
        urls: ['https://cdn.example.com/a.jpg'],
      });

      await expect(
        service.removeImage(apartmentB.id, image.id),
      ).rejects.toBeInstanceOf(ApartmentImageNotFoundException);
    });
  });
});
