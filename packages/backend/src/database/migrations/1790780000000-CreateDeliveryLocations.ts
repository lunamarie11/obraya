import { MigrationInterface, QueryRunner } from "typeorm";

// Ver ADR-027 / fase4e: espejo de CreateDriverLocations (1790710000000),
// pero para la identidad Delivery independiente (ADR-026), que hasta ahora
// no tenia tracking de posicion propio.
export class CreateDeliveryLocations1790780000000 implements MigrationInterface {
    name = 'CreateDeliveryLocations1790780000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "delivery_locations" (
                "delivery_id" uuid NOT NULL,
                "lat" decimal(9,6) NOT NULL,
                "lng" decimal(9,6) NOT NULL,
                "accuracy" float,
                "recorded_at" TIMESTAMPTZ NOT NULL,
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "PK_delivery_locations" PRIMARY KEY ("delivery_id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_locations"
            ADD CONSTRAINT "FK_delivery_locations_delivery_id"
            FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_locations" DROP CONSTRAINT "FK_delivery_locations_delivery_id"`);
        await queryRunner.query(`DROP TABLE "delivery_locations"`);
    }

}
