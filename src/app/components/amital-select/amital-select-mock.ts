import { mockObjectField, MockObjectField, MockObjectTable, mockObjectTable } from '../amital-input/amital-data-mocks';

export const mockLookUpTable = [
  { Code: 1, Name: 'lookup Option 1' },
  { Code: 2, Name: 'lookup Option 2' },
  { Code: 3, Name: 'lookup Option 3' },
];

export async function getMockLookupList(
  table: string,
  size: number,
  startRow = 0,
  maxRows = 300,
  filter: any = null,
  index: number,
  loadAll = false,
  useCache = false,
  showInactive = false
): Promise<any[]> {
  const _temp = filter + index + loadAll + useCache + showInactive; // to do: Remove, it is use mock data, so filter is not used so i get error when compiling

  const list: MockTableRow[] = [];
  const endRow = startRow + size;
  for (let i = startRow; i < endRow && maxRows > i; i++)
    list.push({
      Code: 'Code ' + (i + 1),
      Name: 'Name ' + (i + 1),
      Description: 'Description ' + (i + 1),
      Id: '1-' + (i + 1),
    });

  await new Promise((resolve) => setTimeout(resolve, 100));

  return new Promise((res) => res(list));
}

export interface MockTableRow {
  Code: string;
  Name: string;
  Description: string;
  Id: string;
}

export function getMockObjectField(talbleName: string, fieldName: string): Promise<MockObjectField> {
  const _temp = talbleName + fieldName; // to do: Remove, it is use mock data, so filter is not used so i get error when compiling
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockObjectField);
    }, 100);
  });
}

export function getMockObjectTableData(tableId: string): Promise<MockObjectTable> {
  const _temp = tableId; // to do: Remove, it is use mock data, so filter is not used so i get error when compiling
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockObjectTable);
    }, 100);
  });
}
