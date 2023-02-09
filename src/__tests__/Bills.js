/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { default as Bills } from "../containers/Bills";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import jsdom from "jsdom";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //#1 configuration expect du test de surbrillance
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  const { JSDOM } = jsdom;
  describe("When the new bill button or the eye icon is clicked", () => {
    let bills;
    beforeEach(() => {
      const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
      global.document = dom.window.document;
      bills = new Bills({
        document,
        onNavigate: jest.fn(),
      });
    });

    test("handleClickNewBill should call onNavigate with the right path", () => {
      const buttonNewBill = document.createElement("button");
      buttonNewBill.setAttribute("data-testid", "btn-new-bill");
      document.body.appendChild(buttonNewBill);

      bills.handleClickNewBill();
      expect(bills.onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("handleClickIconEye should call modal with the right argument", () => {
      const iconEye = document.createElement("div");
      iconEye.setAttribute("data-testid", "icon-eye");
      iconEye.setAttribute("data-bill-url", "http://localhost/bill.jpg");
      document.body.appendChild(iconEye);
      global.$ = jest.fn().mockReturnValue({
        modal: jest.fn(),
        find: jest.fn().mockReturnValue({
          html: jest.fn(),
        }),
        width: jest.fn().mockReturnValue(100),
      });

      bills.handleClickIconEye(iconEye);
      expect($).toHaveBeenCalledWith("#modaleFile");
      expect($().modal).toHaveBeenCalledWith("show");
      expect($().find).toHaveBeenCalledWith(".modal-body");
      expect($().width).toHaveBeenCalled();
      expect($().find().html).toHaveBeenCalledWith(
        `<div style='text-align: center;' class="bill-proof-container"><img width=50 src=http://localhost/bill.jpg alt="Bill" /></div>`
      );
    });
  });

  describe("When the page renders", () => {
    let document, store;

    beforeEach(() => {
      const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
      global.document = dom.window.document;
      global.$ = jest.fn().mockReturnValue({
        click: jest.fn(),
      });
      document = {
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(),
      };
      store = {
        bills: () => {
          return {
            list: () =>
              Promise.resolve([
                {
                  date: "2022-01-01",
                  status: "pending",
                },
                {
                  date: "2022-02-01",
                  status: "accepted",
                },
              ]),
          };
        },
      };
    });

    test("should return a list of bills", async () => {
      const bill = new Bills({
        document,
        store,
      });

      const bills = await bill.getBills();
      expect(bills).toEqual([
        {
          date: "1 Jan. 22",
          status: "En attente",
        },
        {
          date: "1 Fév. 22",
          status: "Accepté",
        },
      ]);
    });
  });
});
