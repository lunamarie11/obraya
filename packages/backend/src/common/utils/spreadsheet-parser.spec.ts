import { parseSpreadsheet } from './spreadsheet-parser';

describe('parseSpreadsheet', () => {
  function toCsvBuffer(content: string): Buffer {
    return Buffer.from(content, 'utf-8');
  }

  it('normaliza headers en ingles a minuscula (comportamiento previo intacto)', async () => {
    const csv = 'Name,SKU,Price\nCemento,CEM-1,1234.56\n';
    const rows = await parseSpreadsheet(toCsvBuffer(csv), 'productos.csv');
    expect(rows).toEqual([{ name: 'Cemento', sku: 'CEM-1', price: '1234.56' }]);
  });

  it('traduce headers de productos en espanol a las claves en ingles esperadas', async () => {
    const csv =
      'Nombre,Código,Descripción,Categoría,Subcategoría,Marca,Unidad de Medida,Precio,Cantidad\n' +
      'Cemento,CEM-1,Bolsa 50kg,Materiales,Cementos,Acme,kg,1234.56,10\n';
    const rows = await parseSpreadsheet(toCsvBuffer(csv), 'productos.csv');
    expect(rows).toEqual([
      {
        name: 'Cemento',
        sku: 'CEM-1',
        description: 'Bolsa 50kg',
        category: 'Materiales',
        subcategory: 'Cementos',
        brand: 'Acme',
        unit_of_measure: 'kg',
        price: '1234.56',
        quantity: '10',
      },
    ]);
  });

  it('traduce headers de stock en espanol a las claves en ingles esperadas', async () => {
    const csv = 'ID del Producto,Cantidad,Depósito,Notas\n' + 'abc-123,5,Deposito Norte,Reposicion\n';
    const rows = await parseSpreadsheet(toCsvBuffer(csv), 'stock.csv');
    expect(rows).toEqual([
      {
        product_id: 'abc-123',
        quantity: '5',
        warehouse_id: 'Deposito Norte',
        notes: 'Reposicion',
      },
    ]);
  });

  it('matchea el alias en espanol sin tildes (clientes que no tipean acentos)', async () => {
    const csv = 'nombre,codigo,descripcion,categoria\nCemento,CEM-1,Bolsa,Materiales\n';
    const rows = await parseSpreadsheet(toCsvBuffer(csv), 'productos.csv');
    expect(rows).toEqual([
      { name: 'Cemento', sku: 'CEM-1', description: 'Bolsa', category: 'Materiales' },
    ]);
  });

  it('no pisa una clave en ingles que no tiene alias en espanol (ej: stock)', async () => {
    const csv = 'Nombre,Stock\nCemento,10\n';
    const rows = await parseSpreadsheet(toCsvBuffer(csv), 'productos.csv');
    expect(rows).toEqual([{ name: 'Cemento', stock: '10' }]);
  });

  it('bug #3: acepta "Producto" y "Precio Lista" como encabezados', async () => {
    const csv = 'Producto,Precio Lista\nYeso x 1 KG,1500\n';
    const rows = await parseSpreadsheet(toCsvBuffer(csv), 'productos.csv');
    expect(rows).toEqual([{ name: 'Yeso x 1 KG', price: '1500' }]);
  });

  it('acepta CSV separado por ";" (Excel en español) y con BOM', async () => {
    const csv = '\uFEFFNombre;SKU;Precio\nYeso;YES1;1500,50\n';
    const rows = await parseSpreadsheet(toCsvBuffer(csv), 'plantilla.csv');
    expect(rows).toEqual([{ name: 'Yeso', sku: 'YES1', price: '1500,50' }]);
  });
});
