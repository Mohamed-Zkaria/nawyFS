import { ArrayMaxSize, ArrayMinSize, IsArray, IsUrl } from 'class-validator';

export class AddApartmentImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUrl({}, { each: true })
  urls!: string[];
}
