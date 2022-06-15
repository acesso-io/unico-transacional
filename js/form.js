import { environment } from "./config.js";
import { utils } from "./utils.js";

const BASE_URL = environment.baseUrl;

window.addEventListener("DOMContentLoaded", () => {
  const App = {
    Init: () => {
      App.Components.initForm();
    },
    Components: {
      initForm: () => {
        const form = document.getElementById("form");
        const fieldNames = [
          { name: "field-name", slug: "cardHolderName" },
          { name: "field-cpf", slug: "cardHolderId" },
          { name: "field-first", slug: "cardFirstNumbers" },
          { name: "field-last", slug: "cardLastNumbers" },
          { name: "field-exp", slug: "cardExpirationDate" },
          { name: "field-value", slug: "transactionValue" },
        ];

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          const transactionInfos = fieldNames
            .map((item) => {
              return {
                [item.slug]: document.getElementById(item.name).value.trim(),
              };
            })
            .reduce((all, item) => {
              const infos = Object.assign(all, item);
              return infos;
            }, {});
          App.Actions.startTransaction(transactionInfos);
        });
      },
    },
    Actions: {
      /**
       * Verify if can start a transaction
       * @returns {Object} Transaction's status and ID
       */
      startTransaction: (transactionInfos) => {
        const { cardHolderId, transactionValue } = transactionInfos;

        fetch(`${BASE_URL}/transaction`, {
          method: "POST",
          headers: utils.getHeaders(),
          body: JSON.stringify({
            code: cardHolderId,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            const infos = {
              ...transactionInfos,
              transactionalId: data.Id,
              cardHolderValue: transactionValue === "" ? 0 : transactionValue,
            };

            if (data.Status) {
              sessionStorage.setItem("transactionInfos", JSON.stringify(infos));
              window.location.href = "./capture.html";
              return;
            }
            if (!data.Status && data.Error) {
              alert(`Atenção! Algo deu errado. Erro: ${data.Error.Code}`);
              return;
            }
            alert("Transação não pôde ser iniciada. Verifique o CPF.");
          });
      },
    },
  };
  App.Init();
});
