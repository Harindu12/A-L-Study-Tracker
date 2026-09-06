export const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

export const addDays = (dateStr: string, n: number) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const mondayOf = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0 is Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
};

export const uid = () => Math.random().toString(36).slice(2, 10);
