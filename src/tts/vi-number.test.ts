import { describe, it, expect } from "vitest";
import { normalizeViNumbers, readInteger } from "./vi-number.js";

describe("readInteger", () => {
  it("reads basic numbers", () => {
    expect(readInteger("0")).toBe("không");
    expect(readInteger("15")).toBe("mười lăm");
    expect(readInteger("21")).toBe("hai mươi mốt");
    expect(readInteger("24")).toBe("hai mươi tư");
    expect(readInteger("105")).toBe("một trăm lẻ năm");
    expect(readInteger("402")).toBe("bốn trăm lẻ hai");
  });

  it("reads inner zero blocks with 'không trăm'", () => {
    expect(readInteger("1069")).toBe("một nghìn không trăm sáu mươi chín");
    expect(readInteger("70085")).toBe("bảy mươi nghìn không trăm tám mươi lăm");
    expect(readInteger("1020000000")).toBe("một tỷ không trăm hai mươi triệu");
  });

  it("reads numbers above 999 tỷ", () => {
    expect(readInteger("1000000000000")).toBe("một nghìn tỷ");
  });
});

describe("normalizeViNumbers", () => {
  it("reads comma as decimal (phẩy)", () => {
    expect(normalizeViNumbers("4,5")).toBe("bốn phẩy năm");
    expect(normalizeViNumbers("6,39 lít")).toBe("sáu phẩy ba mươi chín lít");
    expect(normalizeViNumbers("13,08 kWh")).toBe("mười ba phẩy không tám kWh");
    expect(normalizeViNumbers("4,45")).toBe("bốn phẩy bốn mươi lăm");
    expect(normalizeViNumbers("0,5")).toBe("không phẩy năm");
    expect(normalizeViNumbers("3,142")).toBe("ba phẩy một bốn hai");
  });

  it("drops meaningless trailing zeros after the decimal comma", () => {
    expect(normalizeViNumbers("3,50%")).toBe("ba phẩy năm phần trăm");
    expect(normalizeViNumbers("2,0 tỷ")).toBe("hai tỷ");
  });

  it("reads dot + 3 digits as thousands separator", () => {
    expect(normalizeViNumbers("4.500")).toBe("bốn nghìn năm trăm");
    expect(normalizeViNumbers("70.085 xe")).toBe("bảy mươi nghìn không trăm tám mươi lăm xe");
    expect(normalizeViNumbers("1.234.567")).toBe("một triệu hai trăm ba mươi tư nghìn năm trăm sáu mươi bảy");
  });

  it("combines thousands dots and decimal comma", () => {
    expect(normalizeViNumbers("30.340,9 tỷ")).toBe("ba mươi nghìn ba trăm bốn mươi phẩy chín tỷ");
  });

  it("reads other dots as 'chấm' (versions, engine sizes)", () => {
    expect(normalizeViNumbers("máy 1.5 và 2.0")).toBe("máy một chấm năm và hai chấm không");
  });

  it("reads percent", () => {
    expect(normalizeViNumbers("tăng 85,5%")).toBe("tăng tám mươi lăm phẩy năm phần trăm");
    expect(normalizeViNumbers("9 %")).toBe("chín phần trăm");
  });

  it("reads unambiguous English-format numbers by their real value", () => {
    expect(normalizeViNumbers("1,234,567 USD")).toBe("một triệu hai trăm ba mươi tư nghìn năm trăm sáu mươi bảy USD");
    expect(normalizeViNumbers("1,234.5")).toBe("một nghìn hai trăm ba mươi tư phẩy năm");
    expect(normalizeViNumbers("25,000 người")).toBe("hai mươi lăm nghìn người");
  });

  it("reads dates and times", () => {
    expect(normalizeViNumbers("ngày 24.10.2026")).toBe("ngày hai mươi tư tháng mười năm hai nghìn không trăm hai mươi sáu");
    expect(normalizeViNumbers("1/5/2026")).toBe("một tháng năm năm hai nghìn không trăm hai mươi sáu");
    expect(normalizeViNumbers("lúc 7h30, 21:05 và 9h")).toBe("lúc bảy giờ ba mươi, hai mươi mốt giờ năm và chín giờ");
    expect(normalizeViNumbers("tỉ lệ 3:1")).toBe("tỉ lệ ba:một");
  });

  it("reads codes glued to letters and leading-zero codes", () => {
    expect(normalizeViNumbers("VF3 và VF8")).toBe("VF ba và VF tám");
    expect(normalizeViNumbers("Nano S05")).toBe("Nano S không năm");
    expect(normalizeViNumbers("0912345678")).toBe("không chín một hai ba bốn năm sáu bảy tám");
    expect(normalizeViNumbers("2.0L")).toBe("hai chấm không L");
  });

  it("leaves text without digits unchanged", () => {
    const s = "Điểm tin xe xăng tuần này.";
    expect(normalizeViNumbers(s)).toBe(s);
  });
});
