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
        const linkSelfButton = document.getElementById("take-link");
        const linkBackSelfButton = document.getElementById("take-back");
        const linkFinishSelfButton = document.getElementById("take-finish");

        if(skipSelfButton) skipSelfButton.addEventListener("click", App.Actions.skipSelfie);
        if(takeSelfButton) takeSelfButton.addEventListener("click", App.Actions.initSdk);
        if(linkSelfButton) linkSelfButton.addEventListener("click", App.Actions.getLink);
        if(linkBackSelfButton) linkBackSelfButton.addEventListener("click", App.Actions.getBack);
        if(linkFinishSelfButton) linkFinishSelfButton.addEventListener("click", App.Actions.getFinish);
      },
      initModal: () => {
        modal.setContent(
          "<h1>Atenção</h1>" +
            "<p id='error-text'>Falha ao extrair biometria. Por favor, tente novamente.</p>"
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
      /**
       * Get link for share
       */
      getLink: () => {
        const {
          transactionalId,
          cardFirstNumbers,
          cardLastNumbers,
          cardExpirationDate,
          transactionValue,
        } = JSON.parse(sessionStorage.getItem("transactionInfos"));

        const body = {
          transactional_id: transactionalId,
          card: {
            first: cardFirstNumbers,
            last: cardLastNumbers,
            exp: cardExpirationDate,
            value: transactionValue == "" ? 0 : transactionValue,
          },
        };

        fetch(`${BASE_URL}/transaction/link`, {
          method: "POST",
          body: JSON.stringify(body),
          headers: utils.getHeaders(),
        })
            .then((response) => response.json())
            .then((data) => {
              if (data.Status) {
                navigator.share({
                  title: "Mobile - Autenticação",
                  text: "Olá, estou fazendo uma compra com o seu cartão de crédito e, para concluir, preciso autenticar sua identidade." +
                      "\n\n" +
                      "Local da compra: XXXXX" + // please, type your organization name
                      "\n\n" +
                      "É só acessar o link abaixo, informar seu número de CPF e tirar uma selfie. É simples, rápido e seguro.",
                  url: data.Link
                })
                    .then(() => window.location.href = "./confirm-link.html")
                    .catch(error => console.log('Error sharing:', error));
              }
              if (!data.Status && data.Error) {
                document.getElementById("error-text").textContent = data.Error.Description;
                modal.open();
              }
            });
      },
      getBack: () => {
        window.location.href = "./capture.html";
      },
      getFinish: () => {
        if (environment.skipUrl) {
          window.location.href = environment.skipUrl;
        }
        if (!environment.skipUrl) {
          window.location.href = "./";
        }
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
              document.getElementById("error-text").textContent = data.Error.Description;
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
