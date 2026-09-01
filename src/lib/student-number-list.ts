/** カンマ・全角カンマ・読点・スペース区切りの出席番号リストをパース */
export function parseStudentNumberList(input: string, selfId: number): number[] {
  return input
    .split(/[,，、\s]+/)
    .map(s => Number(s.trim()))
    .filter(n => !isNaN(n) && n > 0 && n !== selfId);
}
