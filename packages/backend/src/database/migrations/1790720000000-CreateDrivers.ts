import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDrivers1790720000000 implements MigrationInterface {
    name = 'CreateDrivers1790720000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "drivers_vehicle_type_enum" AS ENUM ('Moto', 'Auto', 'Camioneta', 'Bicicleta', 'APie')
        `);
        await queryRunner.query(`
            CREATE TABLE "drivers" (
                "company_user_id" uuid NOT NULL,
                "company_id" uuid NOT NULL,
                "vehicle_type" "drivers_vehicle_type_enum",
                "license_plate" character varying(10),
                "phone" character varying(20),
                "is_available" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_drivers" PRIMARY KEY ("company_user_id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD CONSTRAINT "FK_drivers_company_user_id"
            FOREIGN KEY ("company_user_id") REFERENCES "company_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`CREATE INDEX "IDX_drivers_company_id" ON "drivers" ("company_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_drivers_company_id"`);
        await queryRunner.query(`ALTER TABLE "drivers" DROP CONSTRAINT "FK_drivers_company_user_id"`);
        await queryRunner.query(`DROP TABLE "drivers"`);
        await queryRunner.query(`DROP TYPE "drivers_vehicle_type_enum"`);
    }

}
