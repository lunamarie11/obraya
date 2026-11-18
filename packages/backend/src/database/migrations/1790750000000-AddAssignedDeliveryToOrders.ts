import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssignedDeliveryToOrders1790750000000 implements MigrationInterface {
    name = 'AddAssignedDeliveryToOrders1790750000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "assigned_delivery_id" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "assigned_delivery_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_assigned_delivery_id" FOREIGN KEY ("assigned_delivery_id") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_assigned_delivery_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "assigned_delivery_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "assigned_delivery_id"`);
    }

}
