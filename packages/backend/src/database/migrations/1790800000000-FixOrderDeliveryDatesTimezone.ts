import { MigrationInterface, QueryRunner } from "typeorm";

// Bug real encontrado por QA (prueba E2E del ciclo de vida del pedido, ver
// CHANGELOG): "scheduled_delivery_date"/"actual_delivery_date" se definieron
// sin "type: timestamptz" en Order (a diferencia de assigned_at,
// assigned_delivery_at, route_calculated_at, que si lo tienen). El driver
// pg serializa el Date saliente como literal de hora local (America/
// Argentina/Buenos_Aires, UTC-3) + offset, pero Postgres, para una columna
// "timestamp without time zone", ignora ese offset y guarda la parte local
// tal cual -- quedando 3hs detras de la instancia real (createdAt/updatedAt,
// que si son timestamptz, no tienen este problema).
//
// Fix de esquema + backfill: reinterpretamos el valor ya guardado como hora
// de Buenos Aires (que es lo que realmente es) para recalcular el instante
// UTC correcto al migrar el tipo de columna.
export class FixOrderDeliveryDatesTimezone1790800000000 implements MigrationInterface {
    name = 'FixOrderDeliveryDatesTimezone1790800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "scheduled_delivery_date" TYPE timestamptz
            USING "scheduled_delivery_date" AT TIME ZONE 'America/Argentina/Buenos_Aires'
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "actual_delivery_date" TYPE timestamptz
            USING "actual_delivery_date" AT TIME ZONE 'America/Argentina/Buenos_Aires'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "actual_delivery_date" TYPE timestamp
            USING "actual_delivery_date" AT TIME ZONE 'America/Argentina/Buenos_Aires'
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "scheduled_delivery_date" TYPE timestamp
            USING "scheduled_delivery_date" AT TIME ZONE 'America/Argentina/Buenos_Aires'
        `);
    }

}
