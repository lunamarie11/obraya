import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeliveries1790740000000 implements MigrationInterface {
    name = 'CreateDeliveries1790740000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "deliveries_vehicle_type_enum" AS ENUM ('Moto', 'Auto', 'Camioneta', 'Bicicleta', 'APie')
        `);
        await queryRunner.query(`
            CREATE TABLE "deliveries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(150) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "first_name" character varying(100) NOT NULL,
                "last_name" character varying(100) NOT NULL,
                "phone" character varying(20),
                "vehicle_type" "deliveries_vehicle_type_enum" NOT NULL,
                "license_plate" character varying(10),
                "is_active" boolean NOT NULL DEFAULT true,
                "is_available" boolean NOT NULL DEFAULT true,
                "fcm_token" character varying(255),
                "last_login_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_deliveries" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_deliveries_email" UNIQUE ("email")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "deliveries"`);
        await queryRunner.query(`DROP TYPE "deliveries_vehicle_type_enum"`);
    }

}
