import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateComboDto } from '../application/dto/create-combo.dto';
import { UpdateComboDto } from '../application/dto/update-combo.dto';
import { In, Repository } from 'typeorm';
import { Combo } from './typeorm/combo-entity';
import { Product } from 'src/product/infrastructure/typeorm/product-entity';
import { CloudinaryService } from 'src/product/infrastructure/cloudinary/cloudinary.service';
import { isUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ComboDescription } from '../domain/value-objects/combo-description.vo';
import { ComboName } from '../domain/value-objects/combo-name.vo';
import { ComboPrice } from '../domain/value-objects/combo-price.vo';
import { ComboCurrency } from '../domain/value-objects/combo-currency.vo';
import { ComboStock } from '../domain/value-objects/combo-stock.vo';
import { CategoryEntity } from 'src/category/infrastructure/typeorm/category-entity';

@Injectable()
export class ComboService {

  private readonly logger = new Logger('ComboService');

  constructor(
    @InjectRepository(Combo)
    private readonly comboRepository: Repository<Combo>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  private mapProductToResponse(product: Product) {
    return {
      product_id: product.product_id,
      product_name: product.product_name.getValue(),
      product_description: product.product_description.getValue(),
      product_price: product.product_price.getValue(),
      product_currency: product.product_currency.getValue(),
      product_weight: product.product_weight.getValue(),
      product_measurement: product.product_measurement.getValue(),
      product_stock: product.product_stock.getValue(),
      product_category: product.product_category,
      images: Array.isArray(product.images) ? product.images.map(img => img.image_url) : [product.images],
    };
  }
  
  private mapComboToResponse(combo: Combo): any {
    return {
      combo_id: combo.combo_id,
      combo_name: combo.combo_name.getValue(),
      combo_description: combo.combo_description.getValue(),
      combo_price: combo.combo_price.getValue(),
      combo_currency: combo.combo_currency.getValue(),
      combo_stock: combo.combo_stock.getValue(),
      combo_category: combo.combo_category?.category_name,
      combo_image: combo.combo_image,
      products: Array.isArray(combo.products) ? combo.products.map(product => this.mapProductToResponse(product)) : [],
      discount: combo.discount ? combo.discount.discount_percentage : null,
    };
  }

  async create(createComboDto: CreateComboDto): Promise<any> {
    try {
      const { products, combo_image, combo_category, ...comboDetails } = createComboDto;

      const category = await this.categoryRepository.findOne({ where: { category_id: combo_category as any } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${combo_category} not found`);
      }

      const productEntities = await this.productRepository.find({
        where: { product_id: In(products) },
        relations: ['images'],
      });

      if (productEntities.length !== products.length) {
        throw new BadRequestException('Some products not found');
      }
  
      const combo = this.comboRepository.create({
        combo_name: new ComboName(comboDetails.combo_name),
        combo_description: new ComboDescription(comboDetails.combo_description),
        combo_price: new ComboPrice(comboDetails.combo_price),
        combo_currency: new ComboCurrency(comboDetails.combo_currency),
        combo_category: category,
        combo_stock: new ComboStock(comboDetails.combo_stock),
        combo_image: await this.cloudinaryService.uploadImage(combo_image, 'combos'),
        products: productEntities,
      });

      await this.comboRepository.save(combo);
  
      return this.mapComboToResponse(combo);

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {

    const { page = 1, perpage = 10 } = paginationDto;

    const combos = await this.comboRepository.find({

      take: perpage,
      skip: (page - 1) * perpage,
      relations: ['products', 'products.images', 'discount', 'combo_category'],
      
    });

    return combos.map(combo => this.mapComboToResponse(combo));
  }

  async findOne(term: string) {
    let combo: Combo;
  
    if (isUUID(term)) {
      combo = await this.comboRepository.findOne({
        where: { combo_id: term },
        relations: ['products', 'products.images', 'discount', 'combo_category'],
      });
    } else {
      combo = await this.comboRepository
        .createQueryBuilder('combo')
        .leftJoinAndSelect('combo.products', 'product')
        .leftJoinAndSelect('product.images', 'image')
        .leftJoinAndSelect('product.discount', 'discount')
        .where('combo.combo_name = :combo_name', { combo_name: term })
        .getOne();
    }
  
    if (!combo) {
      throw new NotFoundException(`Combo with term ${term} not found`);
    }
  
    return this.mapComboToResponse(combo);
  }  

  async update(id: number, updateComboDto: UpdateComboDto) {
    const { products, combo_image, ...comboDetails } = updateComboDto;

    const combo = await this.comboRepository.findOne({ where: { combo_id: id.toString() } });
    if (!combo) {
      throw new NotFoundException(`Combo with id ${id} not found`);
    }

    if (products) {
      const productEntities = await this.productRepository.findByIds(products);
      if (productEntities.length !== products.length) {
        throw new BadRequestException('Some products not found');
      }
      combo.products = productEntities;
    }

    if (combo_image && combo_image !== combo.combo_image) {
      if (combo.combo_image) {
        const publicId = combo.combo_image.split('/').slice(-2).join('/').split('.')[0];
          if (publicId) {
              await this.cloudinaryService.deleteImage(publicId);
          }
      }
      const uploadedImageUrl = await this.cloudinaryService.uploadImage(combo_image, 'combos');
      combo.combo_image = uploadedImageUrl;
  }

    Object.assign(combo, comboDetails);
    await this.comboRepository.save(combo);
    return combo;
  }

  async remove(id: number) {
    const combo = await this.comboRepository.findOne({ where: { combo_id: id.toString() } });
    if (!combo) {
      throw new NotFoundException(`Combo with id ${id} not found`);
    }
    const publicId = combo.combo_image.split('/').slice(-2).join('/').split('.')[0];
    await this.cloudinaryService.deleteImage(publicId);

    await this.comboRepository.remove(combo);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
  
}