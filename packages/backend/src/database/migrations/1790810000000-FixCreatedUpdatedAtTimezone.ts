import { MigrationInterface, QueryRunner } from 'typeorm';

// Ver docs: createdAt/updatedAt usan @CreateDateColumn/@UpdateDateColumn sin
// timestamptz, por lo que el driver `pg` reinterpreta el valor naive (UTC real,
// seteado por DEFAULT now() en la sesion de la DB, que esta en Etc/UTC) como si
// fuera hora local del proceso Node (America/Argentina/Buenos_Aires, UTC-3),
// mostrando los timestamps 3hs adelantados. A diferencia de scheduled/actual
// delivery date (ver migration FixOrderDeliveryDatesTimezone, que vino de un
// `new Date()` en JS y se reinterpreta con 'America/Argentina/Buenos_Aires'),
// estas columnas son pobladas por Postgres mismo (DEFAULT now() / trigger de
// updatedAt) por lo que el texto naive guardado ya es UTC real: el backfill
// correcto es reinterpretar con 'UTC', no con la zona de Buenos Aires.
export class FixCreatedUpdatedAtTimezone1790810000000 implements MigrationInterface {
  name = 'FixCreatedUpdatedAtTimezone1790810000000';

  private readonly columns: Array<{ table: string; columns: string[] }> = [
    { table: 'prices', columns: ['created_at', 'updated_at'] },
    { table: 'price_history', columns: ['created_at'] },
    { table: 'products', columns: ['created_at', 'updated_at'] },
    { table: 'product_variants', columns: ['created_at', 'updated_at'] },
    { table: 'company_users', columns: ['created_at', 'updated_at'] },
    { table: 'companies', columns: ['created_at', 'updated_at'] },
    { table: 'deliveries', columns: ['created_at', 'updated_at'] },
    { table: 'order_messages', columns: ['created_at'] },
    { table: 'orders', columns: ['created_at', 'updated_at'] },
    { table: 'stock_movements', columns: ['created_at'] },
    { table: 'stock', columns: ['created_at', 'updated_at'] },
    { table: 'buyer_favorites', columns: ['created_at'] },
    { table: 'buyers', columns: ['created_at', 'updated_at'] },
    { table: 'buyer_addresses', columns: ['created_at', 'updated_at'] },
    { table: 'drivers', columns: ['created_at', 'updated_at'] },
    { table: 'reviews', columns: ['created_at'] },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, columns } of this.columns) {
      for (const column of columns) {
        await queryRunner.query(`
          ALTER TABLE "${table}"
          ALTER COLUMN "${column}" TYPE timestamptz
          USING "${column}" AT TIME ZONE 'UTC'
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, columns } of this.columns) {
      for (const column of columns) {
        await queryRunner.query(`
          ALTER TABLE "${table}"
          ALTER COLUMN "${column}" TYPE timestamp
          USING "${column}" AT TIME ZONE 'UTC'
        `);
      }
    }
  }
}
