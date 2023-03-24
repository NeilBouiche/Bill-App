/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { default as Bills } from "../containers/Bills";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import mockStore from "../__mocks__/store.js";
import jsdom from "jsdom";
import router from "../app/Router.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { formatDate } from "../app/format.js";

jest.mock("../app/Store.js", () => mockStore);

describe("Given I am connected as an employee", () => {
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
  });
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
        .queryAllByText(
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

  // test d'intégration GET
  describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to Bills", () => {
      test("fetches bills from mock API GET", async () => {
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.Bills);
        await waitFor(() => screen.getByText("Mes notes de frais"));
        expect(screen.getByTestId("tbody")).toBeTruthy();
      });
      describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills");
          Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
          });
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
              email: "a@a",
            })
          );
          const root = document.createElement("div");
          root.setAttribute("id", "root");
          document.body.appendChild(root);
          router();
        });

        afterEach(() => {
          jest.restoreAllMocks();
        });

        test("fetches bills from an API and fails with 404 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 404"));
              },
            };
          });
          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
        });

        test("fetches messages from an API and fails with 500 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 500"));
              },
            };
          });

          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        });
      });
    });
  });
});
