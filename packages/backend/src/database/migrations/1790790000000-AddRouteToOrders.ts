import { MigrationInterface, QueryRunner } from "typeorm";

// Ver ADR-027 / fase4e: cachea el resultado de Google Directions API
// (polyline + distancia + duracion) calculado una sola vez al despachar el
// pedido, para no pagar Directions API en cada poll de posicion.
export class AddRouteToOrders1790790000000 implements MigrationInterface {
    name = 'AddRouteToOrders1790790000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "route_polyline" text,
            ADD "route_distance_meters" int,
            ADD "route_duration_seconds" int,
            ADD "route_calculated_at" TIMESTAMPTZ
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            DROP COLUMN "route_polyline",
            DROP COLUMN "route_distance_meters",
            DROP COLUMN "route_duration_seconds",
            DROP COLUMN "route_calculated_at"
        `);
    }

}
