import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDriverLocations1790710000000 implements MigrationInterface {
    name = 'CreateDriverLocations1790710000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "driver_locations" (
                "company_user_id" uuid NOT NULL,
                "company_id" uuid NOT NULL,
                "lat" decimal(9,6) NOT NULL,
                "lng" decimal(9,6) NOT NULL,
                "accuracy" float,
                "recorded_at" TIMESTAMPTZ NOT NULL,
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "PK_driver_locations" PRIMARY KEY ("company_user_id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "driver_locations"
            ADD CONSTRAINT "FK_driver_locations_company_user_id"
            FOREIGN KEY ("company_user_id") REFERENCES "company_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`CREATE INDEX "IDX_driver_locations_company_id" ON "driver_locations" ("company_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_driver_locations_company_id"`);
        await queryRunner.query(`ALTER TABLE "driver_locations" DROP CONSTRAINT "FK_driver_locations_company_user_id"`);
        await queryRunner.query(`DROP TABLE "driver_locations"`);
    }

}
