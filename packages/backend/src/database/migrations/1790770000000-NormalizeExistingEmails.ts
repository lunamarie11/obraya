import { MigrationInterface, QueryRunner } from "typeorm";

// Corrige emails ya guardados sin trim/lowercase (ver normalize-email.ts).
// Caso real: un cliente se registró, el email quedó con mayúsculas/espacios,
// y al loguearse con la versión normalizada no se encontraba la fila ->
// "Credenciales inválidas". Esta migración normaliza los datos existentes
// en las 4 tablas con email único (companies, company_users, buyers,
// deliveries). Si dos filas colisionarían al normalizar (mismo email en
// distinta capitalización ya registrado dos veces), se deja esa fila sin
// tocar para no violar la constraint unique ni pisar una cuenta existente.
export class NormalizeExistingEmails1790770000000 implements MigrationInterface {
    name = 'NormalizeExistingEmails1790770000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tables = ['companies', 'company_users', 'buyers', 'deliveries'];
        for (const table of tables) {
            await queryRunner.query(`
                UPDATE "${table}" t
                SET email = lower(trim(email))
                WHERE email <> lower(trim(email))
                  AND NOT EXISTS (
                    SELECT 1 FROM "${table}" t2
                    WHERE t2.id <> t.id AND t2.email = lower(trim(t.email))
                  )
            `);
        }
    }

    public async down(): Promise<void> {
        // No reversible: no se guarda la capitalización original.
    }

}
