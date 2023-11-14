import { Request } from 'express';

/**
 * @method isEmpty
 * @param {String | Number | Object} value
 * @returns {Boolean} true & false
 * @description this value is Empty Check
 */
export const isEmpty = (value: string | number | object): boolean => {
  if (value === null) {
    return true;
  } else if (typeof value !== 'number' && value === '') {
    return true;
  } else if (typeof value === 'undefined' || value === undefined) {
    return true;
  } else if (value !== null && typeof value === 'object' && !Object.keys(value).length) {
    return true;
  } else {
    return false;
  }
};

export const retrivePaginationParamFromRequest = (
  req: Request,
): {
  page: number;
  size: number;
} => {
  var p = 0;
  var s = 30;

  const qPage = req.query && req.query.page ? req.query.page : null;
  const qSize = req.query.size ? req.query.size : null;

  // Verifico se qPage esiste e se è un numero e se è maggiore di 0
  if (typeof qPage === 'string' && !isNaN(Number(qPage)) && Number(qPage) > 0) {
    p = Number(qPage);
  }

  // Verifico se qSize esiste e se è un numero e se è maggiore di 0
  if (typeof qSize === 'string' && !isNaN(Number(qSize)) && Number(qSize) > 0) {
    s = Number(qSize);
  }

  return {
    page: p,
    size: s,
  };
};

export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};
