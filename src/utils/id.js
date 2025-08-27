let _id = 0;

export const uid = (prefix = "id") => {
  _id++;
  return `${prefix}_${Date.now()}_${_id}`;
};
