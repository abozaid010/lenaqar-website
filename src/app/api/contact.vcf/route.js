import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "contact.vcf");
    const content = await readFile(filePath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/vcard",
        "Content-Disposition": 'inline; filename="Abozaid-Ibrahim.vcf"',
      },
    });
  } catch (err) {
    return new NextResponse("Not Found", { status: 404 });
  }
}
