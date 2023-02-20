/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

describe("NewBill", () => {
  let newBill;

  beforeEach(() => {
    const document = {
      querySelector: jest.fn().mockReturnValue({
        addEventListener: jest.fn(),
      }),
    };
    const onNavigate = jest.fn();
    const store = {
      bills: jest.fn().mockReturnValue({
        create: jest.fn(),
      }),
    };
    const localStorage = {
      getItem: jest
        .fn()
        .mockReturnValue(JSON.stringify({ email: "test@example.com" })),
    };
    newBill = new NewBill({ document, onNavigate, store, localStorage });
  });

  describe("handleChangeFile", () => {
    it("should disable the send button when no file is selected", () => {
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: "",
        },
      };
      newBill.handleChangeFile(event);
      expect(newBill.btnSendBill.disabled).toBe(true);
    });

    it("should enable the send button when a file with an allowed extension is selected", () => {
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: "test.png",
          files: [{ name: "test.png" }],
        },
      };
      newBill.handleChangeFile(event);
      expect(newBill.btnSendBill.disabled).toBe(false);
    });
  });
});
