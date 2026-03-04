/**
 * Generate filter query for list endpoints - simplified from be-domain-primetime
 */

const generateFilterQuery = (filters) => {
  if (!filters || !filters.rules || !Array.isArray(filters.rules) || filters.rules.length === 0) {
    return {};
  }

  const andConditions = [];

  filters.rules.forEach((rule) => {
    if (!rule.field) return;

    let data = rule.data;
    if (rule.field === 'createdAt' || rule.field === 'updatedAt') {
      data = data ? new Date(data) : data;
    }

    switch (rule.op) {
      case 'cn':
        andConditions.push({
          [rule.field]: { $regex: new RegExp(String(data || ''), 'i') },
        });
        break;
      case 'eq':
        andConditions.push({ [rule.field]: data });
        break;
      case 'ne':
        andConditions.push({ [rule.field]: { $ne: data } });
        break;
      case 'in':
        andConditions.push({ [rule.field]: { $in: Array.isArray(data) ? data : [data] } });
        break;
      case 'nin':
        andConditions.push({ [rule.field]: { $nin: Array.isArray(data) ? data : [data] } });
        break;
      case 'gte':
        andConditions.push({ [rule.field]: { $gte: data } });
        break;
      case 'lte':
        andConditions.push({ [rule.field]: { $lte: data } });
        break;
      case 'startsWith':
        andConditions.push({
          [rule.field]: { $regex: new RegExp(`^${String(data || '')}`, 'i') },
        });
        break;
      default:
        if (data !== undefined && data !== null) {
          andConditions.push({ [rule.field]: data });
        }
    }
  });

  return andConditions.length > 0 ? { $and: andConditions } : {};
};

module.exports = { generateFilterQuery };
