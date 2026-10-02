/* nota. — publicité Google AdSense
   ---------------------------------------------------------------
   QUAND TON COMPTE ADSENSE EST VALIDÉ :
   1. Colle ton identifiant d'éditeur à la place de "" ci-dessous.
      Il ressemble à : "ca-pub-1234567890123456"
   2. (Facultatif) Colle l'identifiant d'un bloc d'annonces dans "slot".
      Sans slot, Google place les pubs tout seul ("annonces automatiques").
   3. Mets aussi ton identifiant dans le fichier ads.txt à la racine du site.
   Tant que "client" est vide, les pages affichent juste "Espace publicitaire".
   --------------------------------------------------------------- */
window.NOTA_ADSENSE = {
  client: "",
  slot: "",
};

(function () {
  try {
    const cfg = window.NOTA_ADSENSE || {};
    if (!/^ca-pub-\d{10,}$/.test(cfg.client || "")) return;
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(cfg.client);
    document.head.appendChild(s);
    if (!cfg.slot) return;
    document.querySelectorAll("[data-ad]").forEach(box => {
      box.textContent = "";
      box.classList.add("live");
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.setAttribute("data-ad-client", cfg.client);
      ins.setAttribute("data-ad-slot", cfg.slot);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      box.appendChild(ins);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  } catch (e) {}
})();
