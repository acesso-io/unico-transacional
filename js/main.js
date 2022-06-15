import {
  UnicoCheckBuilder,
  SelfieCameraTypes,
  UnicoThemeBuilder,
} from "./sdk/UnicoCheckBuilder.min.js";

import { environment } from "./config.js";
import { utils } from "./utils.js";

const BASE_URL = environment.baseUrl;
const modal = new tingle.modal({
  footer: true,
  closeMethods: ["escape"],
});

window.addEventListener("DOMContentLoaded", () => {
  const App = {
    Init: () => {
      App.Components.initButtons();
      App.Components.initModal();
    },
    Components: {
      initButtons: () => {
        const skipSelfButton = document.getElementById("skip-selfie");
        const takeSelfButton = document.getElementById("take-selfie");

        skipSelfButton.addEventListener("click", App.Actions.skipSelfie);
        takeSelfButton.addEventListener("click", App.Actions.initSdk);
      },
      initModal: () => {
        modal.setContent(
          "<h1>Atenção</h1>" +
            "<p>Falha ao extrair biometria. Por favor, tente novamente.</p>"
        );
        modal.addFooterBtn(
          "OK",
          "tingle-btn tingle-btn--pull-right tingle-btn--default",
          function () {
            modal.close();
          }
        );
      },
    },
    Actions: {
      /**
       * Initiate selfie capture SDK
       * @returns {string} a JWT output
       */
      initSdk: () => {
        const loadingSdk = document.getElementById("loading-sdk");
        loadingSdk.classList.add("is-visible");

        const urlPathModels = App.Utils.getHostUrlBase(
          "poc-transacional/models"
        );
        const unicoCameraBuilder = new UnicoCheckBuilder();
        const unicoTheme = new UnicoThemeBuilder()
          .setColorSilhouetteSuccess("#0384fc")
          .setColorSilhouetteError("#D50000")
          .setColorSilhouetteNeutral("#fcfcfc")
          .setBackgroundColor("#000000")
          .setColorText("#fff")
          .setBackgroundColorComponents("#0384fc")
          .setColorTextComponents("#dff1f5")
          .setBackgroundColorButtons("#0384fc")
          .setColorTextButtons("#dff1f5")
          .setBackgroundColorBoxMessage("#fff")
          .setColorTextBoxMessage("#000")
          .build();

        let camera = unicoCameraBuilder
          .setResourceDirectory("/poc-transacional/resources")
          .setModelsPath(urlPathModels)
          .setTheme(unicoTheme)
          .build();

        camera
          .prepareSelfieCamera(
            "/poc-transacional/services.json",
            SelfieCameraTypes.SMART
          )
          .then((cameraOpener) => {
            loadingSdk.classList.remove("is-visible");
            cameraOpener.open(App.Utils.callback());
          });
      },
      /**
       * Skip selfie capture process
       */
      skipSelfie: () => {
        const { transactionalId } = JSON.parse(
          sessionStorage.getItem("transactionInfos")
        );

        fetch(`${BASE_URL}/transaction/skip`, {
          method: "POST",
          headers: utils.getHeaders(),
          body: JSON.stringify({
            transactional_id: transactionalId,
          }),
        })
          .then((response) => response.json())
          .then(() => {
            if (environment.skipUrl) {
              window.location.href = environment.skipUrl;
            }
            if (!environment.skipUrl) {
              window.location.href = "./";
            }
          });
      },
      selfieValidate: (jwtOutput) => {
        const {
          transactionalId,
          cardHolderName,
          cardHolderId,
          cardFirstNumbers,
          cardLastNumbers,
          cardExpirationDate,
          transactionValue,
        } = JSON.parse(sessionStorage.getItem("transactionInfos"));

        const body = {
          code: cardHolderId,
          transactional_id: transactionalId,
          image: jwtOutput,
          card: {
            name: cardHolderName,
            first: cardFirstNumbers,
            last: cardLastNumbers,
            exp: cardExpirationDate,
            value: transactionValue == "" ? 0 : transactionValue,
          },
        };

        fetch(`${BASE_URL}/transaction/validate`, {
          method: "POST",
          headers: utils.getHeaders(),
          body: JSON.stringify(body),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.Status && !environment.successUrl) {
              window.location.href = "./";
            }
            if (data.Status && environment.successUrl) {
              window.location.href = environment.successUrl;
              return;
            }
            if (!data.Status && data.Error) {
              modal.open();
              return;
            }
          });
      },
    },
    Utils: {
      getHostUrlBase: (path) =>
        window.location.protocol + "//" + window.location.host + "/" + path,
      callback: () => {
        return {
          on: {
            success: (obj) => {
              const { encrypted: jtwOutput } = obj;
              App.Actions.selfieValidate(jtwOutput);
            },
            error: (error) => {
              console.error(error);
            },
            support: (supportMessage) => {
              console.log(supportMessage);
            },
          },
        };
      },
    },
  };
  App.Init();
});
