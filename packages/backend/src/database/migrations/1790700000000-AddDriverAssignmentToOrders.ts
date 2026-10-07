import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDriverAssignmentToOrders1790700000000 implements MigrationInterface {
    name = 'AddDriverAssignmentToOrders1790700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "assigned_driver_id" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "assigned_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "driver_commission_percent" integer NOT NULL DEFAULT '8'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_assigned_driver_id" FOREIGN KEY ("assigned_driver_id") REFERENCES "company_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_assigned_driver_id"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "driver_commission_percent"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "assigned_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "assigned_driver_id"`);
    }

}
