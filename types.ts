export type Migration = () => string | string[] | Promise<string | string[]>;
export type Seed = Migration;
