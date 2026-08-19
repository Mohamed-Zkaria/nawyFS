import { ApartmentMapper } from '@/modules/apartments/mappers/apartment.mapper';
import { AppConfigService } from '@/config/app-config.service';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';
import {
  createProject,
  resetProjectFactory,
} from '@/modules/projects/test/project.factory';
import {
  createApartment,
  resetApartmentFactory,
} from '@/modules/apartments/test/apartment.factory';

function createMapper(publicPath = '/uploads'): ApartmentMapper {
  return new ApartmentMapper({
    uploads: { publicPath },
  } as unknown as AppConfigService);
}

function createImage(overrides: Partial<ApartmentImage>): ApartmentImage {
  return Object.assign(new ApartmentImage(), overrides);
}

describe('ApartmentMapper', () => {
  beforeEach(() => {
    resetProjectFactory();
    resetApartmentFactory();
  });

  it('composes image URLs from config and picks the lowest sort_order as cover', () => {
    const project = createProject();
    const images = [
      createImage({ id: 'img-2', storageKey: 'b.jpg', sortOrder: 2 }),
      createImage({ id: 'img-1', storageKey: 'a.jpg', sortOrder: 1 }),
    ];
    const apartment = createApartment(project, { images });

    const detail = createMapper('/files').toDetail(apartment);

    expect(detail.coverImageUrl).toBe('/files/a.jpg');
    expect(detail.images.map((image) => image.url)).toEqual([
      '/files/a.jpg',
      '/files/b.jpg',
    ]);
  });

  it('returns a null coverImageUrl with no images and leaks no entity fields', () => {
    const project = createProject();
    const apartment = createApartment(project, { images: [] });

    const summary = createMapper().toSummary(apartment);

    expect(summary.coverImageUrl).toBeNull();
    expect(summary).not.toHaveProperty('project');
    expect(summary).not.toHaveProperty('deletedAt');
    expect(summary).not.toHaveProperty('images');
  });
});
