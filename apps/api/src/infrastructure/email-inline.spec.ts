import { inlineEmbeddedImages } from "./email.service";

describe("inline email images", () => {
  it("moves data-url logos into cid attachments so inboxes keep the letter", () => {
    const payload = "a".repeat(200);
    const prepared = inlineEmbeddedImages(
      `<img src="data:image/png;base64,${payload}" width="72" height="72" alt="">`,
    );

    expect(prepared.html).toBe(
      '<img src="cid:logo-1" width="72" height="72" alt="">',
    );
    expect(prepared.html).not.toContain("data:image");
    expect(prepared.attachments).toEqual([
      {
        filename: "logo-1.png",
        content: payload,
        contentType: "image/png",
        contentId: "logo-1",
      },
    ]);
  });
});
