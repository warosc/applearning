/**
 * Convierte una cadena de snake_case a camelCase.
 * @param s La cadena en snake_case.
 * @returns La cadena en camelCase.
 */
function toCamel(s: string): string {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase().replace('-', '').replace('_', '');
  });
}

/**
 * Convierte una cadena de camelCase a snake_case.
 * @param s La cadena en camelCase.
 * @returns La cadena en snake_case.
 */
function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Función recursiva para convertir las claves de un objeto o array de objetos.
function convertKeys(obj: any, converter: (s: string) => string): any {
  if (Array.isArray(obj)) {
    return obj.map(v => convertKeys(v, converter));
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = converter(key);
      acc[newKey] = convertKeys(obj[key], converter);
      return acc;
    }, {} as any);
  }
  return obj;
}

export const snakeToCamel = (obj: any) => convertKeys(obj, toCamel);
export const camelToSnake = (obj: any) => convertKeys(obj, toSnake);