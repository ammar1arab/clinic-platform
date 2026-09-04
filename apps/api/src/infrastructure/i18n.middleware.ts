import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { i18nContext, Locale } from "./i18n.context";

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const header = req.headers["accept-language"];
    const locale: Locale = header && header.includes("ar") ? "ar" : "en";

    i18nContext.run(locale, () => {
      next();
    });
  }
}
