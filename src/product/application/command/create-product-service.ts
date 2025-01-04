import { Injectable, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import { CategoryEntity } from 'src/category/infrastructure/typeorm/category-entity';
import { Product } from 'src/product/infrastructure/typeorm/product-entity';
import { Image } from 'src/product/infrastructure/typeorm/image-entity';
import { ClientProxy } from '@nestjs/microservices';
import { IApplicationService } from 'src/common/application/application-service.interface';
import { Repository } from 'typeorm';
import { ProductCurrency } from 'src/product/domain/value-objects/poduct-currency.vo';
import { ProductDescription } from 'src/product/domain/value-objects/product-description.vo';
import { ProductMeasurement } from 'src/product/domain/value-objects/product-measurement.vo';
import { ProductName } from 'src/product/domain/value-objects/product-name.vo';
import { ProductPrice } from 'src/product/domain/value-objects/product-price.vo';
import { ProductStock } from 'src/product/domain/value-objects/product-stock.vo';
import { ProductWeight } from 'src/product/domain/value-objects/product-weight.vo';
import { CreateProductServiceEntryDto } from '../dto/entry/create-product-entry.dto';
import { CreateProductServiceResponseDto } from '../dto/response/create-product-response.dto';
import { ProductRepository } from 'src/product/infrastructure/typeorm/product-repositoy';
import { CloudinaryService } from 'src/product/infrastructure/cloudinary/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductMapper } from 'src/product/infrastructure/mappers/product-mapper';

@Injectable()
export class CreateProductService implements IApplicationService<CreateProductServiceEntryDto, CreateProductServiceResponseDto> {
  constructor(
    private readonly productRepository: ProductRepository,
    @InjectRepository(CategoryEntity) private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly cloudinaryService: CloudinaryService,
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {}

  async execute(createProductDto: CreateProductServiceEntryDto): Promise<CreateProductServiceResponseDto> {
    try {
      const { product_category, images, ...productDetails } = createProductDto;

      const category = await this.categoryRepository.findOne({ where: { category_id: product_category } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${product_category} not found`);
      }

      const productName = new ProductName(productDetails.product_name);
      const productDescription = new ProductDescription(productDetails.product_description);
      const productPrice = new ProductPrice(productDetails.product_price);
      const productCurrency = new ProductCurrency(productDetails.product_currency);
      const productWeight = new ProductWeight(productDetails.product_weight.toString());
      const productMeasurement = new ProductMeasurement(productDetails.product_measurement);
      const productStock = new ProductStock(productDetails.product_stock);

      const product = new Product();
      product.product_name = productName;
      product.product_description = productDescription;
      product.product_price = productPrice;
      product.product_currency = productCurrency;
      product.product_weight = productWeight;
      product.product_measurement = productMeasurement;
      product.product_stock = productStock;
      product.product_category = category;

      const imageEntities = await Promise.all(
        images.map(async (imagePath) => {
          const imageUrl = await this.cloudinaryService.uploadImage(imagePath, 'products');
          const image = new Image();
          image.image_url = imageUrl;
          image.product = product;
          return image;
        }),
      );

      product.images = imageEntities;

      await this.productRepository.saveProduct(product);

      this.client.send('product_notification', {
        productImages: createProductDto.images,
        productName: createProductDto.product_name,
        productCategory: category.category_name,
        productWeight: createProductDto.product_weight,
        productMeasurement: createProductDto.product_measurement,
        productDescription: createProductDto.product_description,
        message: 'Check out our new products and their offers!',
      }).subscribe();

      return ProductMapper.mapProductToResponse(product);
    } catch (error) {
      console.error('Error creating product:', error);
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any): void {
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}