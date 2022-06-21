export const utils = {
  getHeaders: () => {
    return new Headers({
      //aqui o cliente pode configurar seus header adicionando authorizion ou qq outro padrão necessário para comunicar com seu próprio backend
      "Content-Type": "application/json; charset=utf-8",
    });
  },
};
