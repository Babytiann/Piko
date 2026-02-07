import { NextResponse } from "next/server";

/**
 * GET /piko/homepage/summary/v1
 * 获取首页数据摘要
 */
export async function GET() {
  // TODO: 由你补充具体返回数据结构
  const summary = {
    // 示例占位，后续替换为实际业务数据
    success: true,
    data: {},
  };

  return NextResponse.json(summary);
}
