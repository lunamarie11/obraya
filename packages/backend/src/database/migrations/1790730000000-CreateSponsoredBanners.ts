import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSponsoredBanners1790730000000 implements MigrationInterface {
    name = 'CreateSponsoredBanners1790730000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "sponsored_banners" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "company_id" uuid NOT NULL,
                "title" character varying(80) NOT NULL,
                "subtitle" character varying(160),
                "image_url" character varying,
                "cta_label" character varying(40) NOT NULL DEFAULT 'Ver tienda',
                "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "priority" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_sponsored_banners" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "sponsored_banners"
            ADD CONSTRAINT "FK_sponsored_banners_company_id"
            FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`CREATE INDEX "IDX_sponsored_banners_company_id" ON "sponsored_banners" ("company_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_sponsored_banners_company_id"`);
        await queryRunner.query(`ALTER TABLE "sponsored_banners" DROP CONSTRAINT "FK_sponsored_banners_company_id"`);
        await queryRunner.query(`DROP TABLE "sponsored_banners"`);
    }

}
