import { NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@/common/constants/error-codes';

export class ApartmentNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      code: ErrorCode.APARTMENT_NOT_FOUND,
      message: `Apartment ${id} not found`,
    });
  }
}

export class ProjectNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      code: ErrorCode.PROJECT_NOT_FOUND,
      message: `Project ${id} not found`,
    });
  }
}

export class ApartmentImageNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      code: ErrorCode.IMAGE_NOT_FOUND,
      message: `Image ${id} not found`,
    });
  }
}
