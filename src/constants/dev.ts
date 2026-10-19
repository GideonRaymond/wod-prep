/**
 * MOCK_LOAD=true makes cached results arrive as slowly as real ones, to test the loading screens
 * (see src/server/mockLoad.ts). In the browser it also turns off the countdown to the class.
 */
export const MOCK_LOAD = process.env.MOCK_LOAD === "true";
