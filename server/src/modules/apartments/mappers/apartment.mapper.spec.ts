import { ApartmentMapper } from '@/modules/apartments/mappers/apartment.mapper';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';
import {
  createProject,
  resetProjectFactory,
} from '@/modules/projects/test/project.factory';
import {
  createApartment,
  resetApartmentFactory,
} from '@/modules/apartments/test/apartment.factory';

function createImage(overrides: Partial<ApartmentImage>): ApartmentImage {
  return Object.assign(new ApartmentImage(), overrides);
}

describe('ApartmentMapper', () => {
  beforeEach(() => {
    resetProjectFactory();
    resetApartmentFactory();
  });

  it('picks the lowest sort_order as cover and preserves each image URL as-is', () => {
    const project = createProject();
    const images = [
      createImage({
        id: 'img-2',
        url: 'https://cdn.example.com/b.jpg',
        sortOrder: 2,
      }),
      createImage({
        id: 'img-1',
        url: 'https://cdn.example.com/a.jpg',
        sortOrder: 1,
      }),
    ];
    const apartment = createApartment(project, { images });

    const detail = new ApartmentMapper().toDetail(apartment);

    expect(detail.coverImageUrl).toBe('https://cdn.example.com/a.jpg');
    expect(detail.images.map((image) => image.url)).toEqual([
      'https://cdn.example.com/a.jpg',
      'https://cdn.example.com/b.jpg',
    ]);
  });

  it('returns a null coverImageUrl with no images and leaks no entity fields', () => {
    const project = createProject();
    const apartment = createApartment(project, { images: [] });

    const summary = new ApartmentMapper().toSummary(apartment);

    expect(summary.coverImageUrl).toBeNull();
    expect(summary).not.toHaveProperty('project');
    expect(summary).not.toHaveProperty('deletedAt');
    expect(summary).not.toHaveProperty('images');
  });
});
