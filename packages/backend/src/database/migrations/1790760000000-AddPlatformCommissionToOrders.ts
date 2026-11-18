import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformCommissionToOrders1790760000000 implements MigrationInterface {
    name = 'AddPlatformCommissionToOrders1790760000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ADD "platform_commission_percent" integer NOT NULL DEFAULT 4`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "platform_commission_amount" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "mp_fee_amount" bigint`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "net_amount_to_company" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "net_amount_to_company"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "mp_fee_amount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "platform_commission_amount"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "platform_commission_percent"`);
    }

}
