/* Console PAV — Clients (CRM) et facturation.
   Fichier séparé de index.html : il ajoute les onglets « Clients » et « Factures »
   (boutons, sections) et s'appuie sur les fonctions de la console exposées dans window.PAV. */
(function () {
  "use strict";
  if (!window.PAV) return;
  var $ = PAV.$, api = PAV.api, msg = PAV.msg, cacher = PAV.cacher;
  // Onglets : boutons dans la barre, sections dans la page.
  var nav = document.querySelector("nav"), main = document.querySelector("main");
  if (!nav || !main) return;
  [["clients", "Clients"], ["carte", "Carte"], ["agenda", "Agenda"], ["factu", "Factures"]].forEach(function (o) {
    var b = document.createElement("button"); b.dataset.onglet = o[0]; b.textContent = o[1]; nav.appendChild(b);
  });
  main.insertAdjacentHTML("beforeend", "  <section id=\"clients\">\n    <div class=\"carte\">\n      <h2>Suivi des communes <button class=\"second\" id=\"g-recharger\" type=\"button\" style=\"float:right;padding:4px 10px;font-size:13px\">Actualiser</button></h2>\n      <p class=\"petit\">Une ligne par commune : o\u00f9 en est la relation, et la prochaine action pr\u00e9vue.</p>\n      <div id=\"g-pipeline\" class=\"petit\">\u2014</div>\n      <div class=\"msg\" id=\"msg-gestion\"></div>\n    </div>\n    <div class=\"carte\">\n      <h2>Fiche client</h2>\n      <label for=\"g-commune\"><b>Commune</b></label>\n      <select id=\"g-commune\"></select>\n      <div id=\"g-contrat\" class=\"petit\" style=\"margin-top:8px\"></div>\n      <div id=\"g-fiche\"></div>\n      <button class=\"principal\" id=\"g-fiche-ok\" type=\"button\">Enregistrer la fiche</button>\n      <div class=\"msg\" id=\"msg-fiche\"></div>\n    </div>\n    <div class=\"carte\">\n      <h2>Contacts</h2>\n      <div id=\"g-contacts\" class=\"petit\"></div>\n      <div id=\"g-contact-form\" style=\"margin-top:10px;padding-top:10px;border-top:1px solid var(--trait)\"></div>\n      <div class=\"msg\" id=\"msg-contact\"></div>\n    </div>\n    <div class=\"carte\">\n      <h2>\u00c9changes</h2>\n      <p class=\"petit\">Appels, r\u00e9unions, d\u00e9monstrations, relances\u2026 et la prochaine action \u00e0 faire.</p>\n      <div id=\"g-echanges\" class=\"petit\"></div>\n      <div id=\"g-echange-form\" style=\"margin-top:10px;padding-top:10px;border-top:1px solid var(--trait)\"></div>\n      <div class=\"msg\" id=\"msg-echange\"></div>\n    </div>\n  </section>\n\n  <section id=\"factu\">\n    <div class=\"carte\">\n      <h2>\u00c9metteur des devis et factures</h2>\n      <p class=\"petit\">Ces informations figureront sur chaque document. Tant que des champs sont \u00ab \u00c0 REMPLIR \u00bb, les documents restent des brouillons sans valeur.</p>\n      <div id=\"g-emetteur\"></div>\n      <button class=\"principal\" id=\"g-emetteur-ok\" type=\"button\">Enregistrer l'\u00e9metteur</button>\n      <div class=\"msg\" id=\"msg-emetteur\"></div>\n    </div>\n    <div class=\"carte\">\n      <h2>Devis <button class=\"second\" id=\"g-devis-nouveau\" type=\"button\" style=\"float:right;padding:4px 10px;font-size:13px\">Nouveau devis</button></h2>\n      <div id=\"g-devis-liste\" class=\"petit\">\u2014</div>\n    </div>\n    <div class=\"carte\">\n      <h2>Factures <button class=\"second\" id=\"g-facture-nouvelle\" type=\"button\" style=\"float:right;padding:4px 10px;font-size:13px\">Nouvelle facture</button></h2>\n      <div id=\"g-factures-liste\" class=\"petit\">\u2014</div>\n    </div>\n    <div class=\"carte\" id=\"g-doc\" hidden>\n      <h2 id=\"g-doc-titre\">Document</h2>\n      <div id=\"g-doc-entete\"></div>\n      <h2 style=\"margin-top:14px\">Lignes</h2>\n      <div id=\"g-doc-lignes\"></div>\n      <button class=\"second\" id=\"g-doc-ligne\" type=\"button\" style=\"margin-top:8px\">+ Ajouter une ligne</button>\n      <div id=\"g-doc-totaux\" class=\"petit\" style=\"margin-top:10px;text-align:right;font-size:15px\"></div>\n      <div class=\"msg\" id=\"msg-doc\"></div>\n      <div style=\"display:flex;gap:8px;margin-top:12px;flex-wrap:wrap\">\n        <button class=\"second\" id=\"g-doc-fermer\" type=\"button\" style=\"flex:1\">Fermer</button>\n        <button class=\"second\" id=\"g-doc-supprimer\" type=\"button\" style=\"flex:1;color:var(--ko)\">Supprimer le brouillon</button>\n        <button class=\"principal\" id=\"g-doc-ok\" type=\"button\" style=\"flex:2;margin-top:0\">Enregistrer</button>\n      </div>\n    </div>\n  </section>\n");
  // Bascule d'onglet pour les deux nouveaux boutons (les autres sont gérés par la console).
  Array.prototype.forEach.call(nav.querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () {
      if (["clients", "carte", "agenda", "factu"].indexOf(b.dataset.onglet) < 0) return;
      Array.prototype.forEach.call(nav.querySelectorAll("button"), function (x) { x.classList.toggle("actif", x === b); });
      Array.prototype.forEach.call(document.querySelectorAll("main > section"), function (s) { s.classList.toggle("actif", s.id === b.dataset.onglet); });
      if (!G_CHARGE) chargerGestion(); else if (b.dataset.onglet === "carte") ouvrirCarteProspects(); else if (b.dataset.onglet === "agenda") dessinerAgenda();
    });
  });
  /* — Clients (CRM) et facturation : fiches, contacts, échanges, émetteur, devis, factures.
     Données dans le classeur commun (onglets créés par n8n au premier chargement). — */
  var G = null, G_CHARGE = false, G_DOC = null;
  var G_STATUTS = [["prospect", "Prospect"], ["demo", "Démo faite"], ["devis", "Devis en cours"], ["client", "Client"], ["suspendu", "Suspendu"], ["perdu", "Perdu"]];
  var G_TYPES_ECH = [["appel", "Appel"], ["email", "E-mail"], ["reunion", "Réunion"], ["demo", "Démonstration"], ["relance", "Relance"], ["courrier", "Courrier"], ["autre", "Autre"]];
  var G_ST_DEVIS = [["brouillon", "Brouillon"], ["envoye", "Envoyé"], ["accepte", "Accepté"], ["refuse", "Refusé"], ["expire", "Expiré"]];
  var G_ST_FACT = [["brouillon", "Brouillon"], ["emise", "Émise"], ["deposee_chorus", "Déposée sur Chorus Pro"], ["payee", "Payée"], ["annulee", "Annulée (avoir)"]];
  var G_TYPES_FACT = [["forfait", "Forfait annuel"], ["avenant", "Avenant (points ajoutés)"], ["autre", "Autre"]];
  function gEsc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function gLib(liste, v) { var x = liste.filter(function (p) { return p[0] === v; })[0]; return x ? x[1] : (v || "—"); }
  function gEuros(n) { var x = Number(String(n || 0).replace(",", ".")) || 0; return x.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }); }
  function gDateFR(d) { if (!d) return ""; var x = new Date(String(d).slice(0, 10) + "T12:00:00"); return isNaN(x) ? d : x.toLocaleDateString("fr-FR"); }
  function gChamp(id, lib, val, type, options, aide) {
    var h = '<label for="' + id + '"><b>' + gEsc(lib) + '</b>' + (aide ? ' <span class="petit">— ' + gEsc(aide) + '</span>' : '') + '</label>';
    if (options) return h + '<select id="' + id + '">' + options.map(function (o) { return '<option value="' + gEsc(o[0]) + '"' + (o[0] === val ? " selected" : "") + '>' + gEsc(o[1]) + '</option>'; }).join("") + '</select>';
    if (type === "zone") return h + '<textarea id="' + id + '" rows="2">' + gEsc(val) + '</textarea>';
    return h + '<input id="' + id + '" type="' + (type || "text") + '" value="' + gEsc(val) + '">';
  }
  function gVal(id) { var e = $(id); return e ? e.value.trim() : ""; }
  function gCommunes() {
    var m = {};
    (G.communes || []).forEach(function (c) { if (c.commune) m[c.commune] = c.nom || c.commune; });
    (G.Clients || []).forEach(function (c) { if (c.commune && !m[c.commune]) m[c.commune] = c.ville || String(c.nom_officiel || c.commune).replace(/^Mairie (de |d'|du |des )/i, ""); });
    return Object.keys(m).sort(function (a, b) { return m[a].localeCompare(m[b], "fr"); }).map(function (k) { return [k, m[k]]; });
  }
  function gClient(com) { return (G.Clients || []).filter(function (c) { return c.commune === com; })[0] || { commune: com }; }

  function chargerGestion(garderMsg) {
    if (!garderMsg) cacher("msg-gestion");
    $("g-pipeline").textContent = "Chargement…";
    return api("gestion", { op: "lire" }).then(function (j) {
      G = j.donnees || {}; G_CHARGE = true;
      if ((j.crees || []).length) msg("msg-gestion", "Onglets créés dans le classeur commun : " + j.crees.join(", ") + ".", "ok");
      dessinerGestion();
    }).catch(function (e) { $("g-pipeline").textContent = "—"; msg("msg-gestion", e.message, "ko"); });
  }
  function gEnvoyer(donnees, idMsg, ok) {
    msg(idMsg, "Enregistrement…");
    return api("gestion", donnees).then(function (j) { msg(idMsg, ok, "ok"); return chargerGestion(true).then(function () { return j; }); })
      .catch(function (e) { msg(idMsg, e.message, "ko"); throw e; });
  }

  function dessinerGestion() {
    // Liste des communes (sélecteur de la fiche), en gardant le choix courant.
    var s = $("g-commune"), avant = s.value;
    s.innerHTML = gCommunes().map(function (c) { return '<option value="' + gEsc(c[0]) + '">' + gEsc(c[1]) + '</option>'; }).join("");
    if (avant && gCommunes().some(function (c) { return c[0] === avant; })) s.value = avant;
    dessinerPipeline(); dessinerFiche(); dessinerEmetteur(); dessinerDocs(); dessinerAgenda();
    if ($("carte") && $("carte").classList.contains("actif")) ouvrirCarteProspects();
  }
  function dessinerPipeline() {
    var lignes = gCommunes().map(function (c) {
      var cl = gClient(c[0]);
      var afaire = (G.Echanges || []).filter(function (e) { return e.commune === c[0] && e.fait !== "oui" && (e.prochaine_action || e.echeance); })
        .sort(function (a, b) { return (a.echeance || "9999").localeCompare(b.echeance || "9999"); })[0];
      var retard = afaire && afaire.echeance && afaire.echeance < new Date().toISOString().slice(0, 10);
      return '<tr><td><a href="#" data-gcom="' + gEsc(c[0]) + '">' + gEsc(c[1]) + '</a>' + (cl.population ? '<br><span style="color:var(--doux)">' + Number(cl.population).toLocaleString("fr-FR") + ' hab.' + (cl.nb_points ? ' · ' + cl.nb_points + ' pts' : '') + '</span>' : '') + '</td><td>' + gEsc(gLib(G_STATUTS, cl.statut || "prospect")) + '</td><td' + (retard ? ' style="color:var(--ko)"' : '') + '>'
        + (afaire ? gEsc(afaire.prochaine_action || afaire.resume) + (afaire.echeance ? ' — ' + gDateFR(afaire.echeance) : '') : '<span style="color:var(--doux)">rien de prévu</span>') + '</td></tr>';
    });
    $("g-pipeline").innerHTML = lignes.length ? '<table class="dns"><tr><th style="text-align:left">Commune</th><th style="text-align:left">Statut</th><th style="text-align:left">Prochaine action</th></tr>' + lignes.join("") + '</table>' : "Aucune commune.";
  }
  function dessinerFiche() {
    var com = $("g-commune").value; if (!com) { $("g-fiche").innerHTML = ""; return; }
    var c = gClient(com), ct = (G.communes || []).filter(function (x) { return x.commune === com; })[0] || {};
    $("g-contrat").innerHTML = "Contrat (onglet Communes) : tarif par point <b>" + (ct.tarif_point ? gEuros(ct.tarif_point) : "non renseigné") + "</b> · anniversaire <b>" + (gDateFR(ct.anniversaire) || "non renseigné") + "</b> · initialisation " + (ct.cloture_initialisation ? "clôturée le <b>" + gDateFR(ct.cloture_initialisation) + "</b>" : "<b>en cours</b>") + (ct.etat ? " · état : " + gEsc(ct.etat) : "");
    var pt = gPotentiel(com);
    $("g-contrat").innerHTML += '<div style="margin-top:8px;padding:8px 12px;background:#EEF5F0;border:1px solid var(--trait);border-radius:9px;font-size:15px">Potentiel : <b>' + (pt.points || "?") + ' point(s)</b>' + (pt.estime ? ' <span class="petit">(estimé : ' + gEsc(pt.base) + ')</span>' : ' <span class="petit">(' + gEsc(pt.base) + ')</span>')
      + (pt.tarif && pt.points ? ' · <b>' + gEuros(pt.points * pt.tarif) + ' HT/an</b> <span class="petit">à ' + gEuros(pt.tarif) + '/point</span>' : ' · <span class="petit">montant : renseignez « tarif_point_defaut » (onglet Factures) ou le tarif de la commune</span>') + '</div>';
    $("g-fiche").innerHTML = gChamp("gf-statut", "Statut de la relation", c.statut || "prospect", null, G_STATUTS)
      + gChamp("gf-nom", "Nom officiel (facturation)", c.nom_officiel, "text", null, "ex. Mairie d'Andancette")
      + gChamp("gf-siret", "SIRET de la mairie", c.siret)
      + gChamp("gf-chorus", "Code service Chorus Pro", c.code_service_chorus, "text", null, "si la mairie en impose un")
      + gChamp("gf-adresse", "Adresse de facturation", c.adresse_facturation)
      + '<div style="display:grid;grid-template-columns:120px 1fr;gap:8px">' + '<div>' + gChamp("gf-cp", "Code postal", c.code_postal) + '</div><div>' + gChamp("gf-ville", "Ville", c.ville) + '</div></div>'
      + gChamp("gf-email", "E-mail de facturation", c.email_facturation, "email")
      + gChamp("gf-date", "Date du contrat", c.date_contrat, "date")
      + gChamp("gf-notes", "Notes", c.notes, "zone")
      + '<div style="margin-top:12px;padding:10px 12px;background:#FAF8F3;border:1px solid var(--trait);border-radius:9px"><b>Infos publiques</b>'
      + ' <button class="second" type="button" id="gf-auto" style="float:right;padding:4px 10px;font-size:13px">Rechercher automatiquement</button>'
      + '<div id="gf-infos" class="petit" style="margin-top:6px;clear:both"></div></div>';
    dessinerInfos(c);
    dessinerContacts(); dessinerEchanges();
  }
  /* Infos publiques de la commune : geo.api.gouv.fr (INSEE, habitants, intercommunalité),
     Annuaire de l'administration (téléphone, e-mail, site, adresse, horaires de la mairie),
     Répertoire national des élus (maire), Recherche d'entreprises (SIRET de la commune),
     et le Referentiel de la commune (points de collecte). Rien n'est enregistré sans « Enregistrer la fiche ». */
  var G_AUTO = null;
  var G_INFOS = ["code_insee", "population", "epci", "telephone_mairie", "email_mairie", "site_mairie", "horaires_mairie", "maire", "maire_depuis", "nb_points", "nb_points_a_verifier", "flux", "infos_maj"];
  function dessinerInfos(c) {
    var x = G_AUTO || c || {}, l = [];
    if (x.code_insee) l.push("Code INSEE <b>" + gEsc(x.code_insee) + "</b>");
    if (x.population) l.push("<b>" + Number(x.population).toLocaleString("fr-FR") + "</b> habitants");
    if (x.epci) l.push("Intercommunalité : <b>" + gEsc(x.epci) + "</b>");
    if (x.maire) l.push("Maire : <b>" + gEsc(x.maire) + "</b>" + (x.maire_depuis ? " (depuis le " + gDateFR(x.maire_depuis) + ")" : ""));
    if (x.telephone_mairie) l.push("Mairie : <a href=\"tel:" + gEsc(x.telephone_mairie) + "\">" + gEsc(x.telephone_mairie) + "</a>");
    if (x.email_mairie) l.push("<a href=\"mailto:" + gEsc(x.email_mairie) + "\">" + gEsc(x.email_mairie) + "</a>");
    if (x.site_mairie) l.push("<a href=\"" + gEsc(x.site_mairie) + "\" target=\"_blank\" rel=\"noopener\">site de la mairie</a>");
    if (x.horaires_mairie) l.push("Horaires : " + gEsc(x.horaires_mairie));
    if (x.nb_points !== undefined && x.nb_points !== "") l.push("Points de collecte : <b>" + gEsc(x.nb_points) + "</b> actifs" + (Number(x.nb_points_a_verifier) ? ", " + gEsc(x.nb_points_a_verifier) + " à vérifier" : "") + (x.flux ? " — " + gEsc(x.flux) : ""));
    var maireConnu = x.maire && (G.Contacts || []).some(function (k) { return k.commune === $("g-commune").value && /maire/i.test(k.fonction || "") && k.nom.toLowerCase() === String(x.maire).toLowerCase(); });
    $("gf-infos").innerHTML = (l.length ? l.join("<br>") : "Aucune info publique enregistrée : cliquez sur « Rechercher automatiquement ».")
      + (x.infos_maj ? '<br><span style="color:var(--doux)">Recherché le ' + gDateFR(x.infos_maj) + '</span>' : "")
      + (G_AUTO ? '<br><b style="color:var(--accent)">Pas encore enregistré : cliquez sur « Enregistrer la fiche ».</b>' : "")
      + (x.maire && !maireConnu ? '<br><button class="second" type="button" id="gf-maire" style="margin-top:6px;padding:4px 10px;font-size:13px">Ajouter le maire aux contacts</button>' : "");
  }
  function gJson(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function gHoraires(p) {
    var l = []; try { l = typeof p === "string" ? JSON.parse(p) : (p || []); } catch (e) { return ""; }
    var h = function (v) { return v ? String(v).slice(0, 5).replace(":", "h") : ""; };
    return l.map(function (o) {
      var j = o.nom_jour_debut + (o.nom_jour_fin && o.nom_jour_fin !== o.nom_jour_debut ? "–" + o.nom_jour_fin : "");
      var c1 = o.valeur_heure_debut_1 ? h(o.valeur_heure_debut_1) + "-" + h(o.valeur_heure_fin_1) : "";
      var c2 = o.valeur_heure_debut_2 ? h(o.valeur_heure_debut_2) + "-" + h(o.valeur_heure_fin_2) : "";
      return j + " " + [c1, c2].filter(Boolean).join(", ");
    }).join(" ; ");
  }
  function rechercherInfos() {
    var com = $("g-commune").value; if (!com) return;
    var nom = (gCommunes().filter(function (c) { return c[0] === com; })[0] || [com, com])[1];
    var c = gClient(com), cp = gVal("gf-cp");
    msg("msg-fiche", "Recherche des infos publiques de " + nom + "…");
    gJson("https://geo.api.gouv.fr/communes?nom=" + encodeURIComponent(nom) + "&fields=nom,code,codesPostaux,codeDepartement,population,epci&boost=population&limit=8").then(function (l) {
      l = l.filter(function (x) { return x.nom.toLowerCase() === String(nom).toLowerCase(); }).concat(l.filter(function (x) { return x.nom.toLowerCase() !== String(nom).toLowerCase(); }));
      var g = c.code_insee ? l.filter(function (x) { return x.code === c.code_insee; })[0] : null;
      if (!g && cp) g = l.filter(function (x) { return (x.codesPostaux || []).indexOf(cp) >= 0; })[0];
      if (!g && l.length > 1 && l[1].nom.toLowerCase() === l[0].nom.toLowerCase()) {
        var choix = prompt("Plusieurs communes portent ce nom. Indiquez le numéro de la bonne :\n" + l.filter(function (x) { return x.nom.toLowerCase() === l[0].nom.toLowerCase(); }).map(function (x, i) { return (i + 1) + ". " + x.nom + " (" + x.codeDepartement + ") — " + (x.population || "?") + " hab."; }).join("\n"), "1");
        if (!choix) throw new Error("Recherche annulée.");
        g = l[Number(choix) - 1];
      }
      g = g || l[0];
      if (!g) throw new Error("Commune introuvable dans geo.api.gouv.fr : vérifiez son nom.");
      var insee = g.code, a = { code_insee: insee, population: g.population || "", epci: (g.epci && g.epci.nom) || "", infos_maj: new Date().toISOString().slice(0, 10) };
      var annuaire = gJson("https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?where=" + encodeURIComponent("code_insee_commune='" + insee + "' and pivot like 'mairie'") + "&limit=5").then(function (j) {
        var m = (j.results || []).filter(function (x) { return /^Mairie -/i.test(x.nom || ""); })[0] || (j.results || [])[0]; if (!m) return;
        var lire = function (v) { try { return typeof v === "string" ? JSON.parse(v) : (v || []); } catch (e) { return []; } };
        a.telephone_mairie = (lire(m.telephone)[0] || {}).valeur || "";
        a.email_mairie = m.adresse_courriel || "";
        a.site_mairie = (lire(m.site_internet)[0] || {}).valeur || "";
        a.horaires_mairie = gHoraires(m.plage_ouverture);
        var ad = lire(m.adresse).filter(function (x) { return /adresse/i.test(x.type_adresse || ""); })[0] || lire(m.adresse)[0];
        if (ad) { a._adresse = [ad.complement1, ad.numero_voie].filter(Boolean).join(", "); a._cp = ad.code_postal || ""; a._ville = ad.nom_commune || ""; }
      }).catch(function () {});
      var maire = gJson("https://www.data.gouv.fr/api/1/datasets/5c34c4d1634f4173183a64f1/").then(function (d) {
        var rs = (d.resources || []).filter(function (r) { return /maire/i.test(r.title || ""); })[0]; if (!rs) return;
        return gJson("https://tabular-api.data.gouv.fr/api/resources/" + rs.id + "/data/?" + encodeURIComponent("Code de la commune") + "__exact=" + encodeURIComponent(insee)).then(function (j) {
          var e = (j.data || [])[0]; if (!e) return;
          var pre = String(e["Prénom de l'élu"] || ""), nm = String(e["Nom de l'élu"] || "");
          a.maire = (pre.charAt(0).toUpperCase() + pre.slice(1).toLowerCase() + " " + nm.toUpperCase()).trim();
          var dd = String(e["Date de début de la fonction"] || ""), m2 = dd.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          a.maire_depuis = m2 ? m2[3] + "-" + m2[2] + "-" + m2[1] : dd;
        });
      }).catch(function () {});
      var siret = gJson("https://recherche-entreprises.api.gouv.fr/search?q=commune&code_commune=" + encodeURIComponent(insee) + "&nature_juridique=7210&per_page=3").then(function (j) {
        var e = (j.results || [])[0]; if (e && e.siege) a._siret = e.siege.siret || "";
      }).catch(function () {});
      var points = api("points", { commune: com }).then(function (j) {
        var p = j.points || [], f = {};
        a.nb_points = p.filter(function (x) { return !x.actif || x.actif === "oui"; }).length;
        a.nb_points_a_verifier = p.filter(function (x) { return x.actif === "a_verifier"; }).length;
        p.forEach(function (x) { if (x.actif === "non") return; (x.flux || []).forEach(function (k) { f[k] = (f[k] || 0) + 1; }); });
        a.flux = Object.keys(f).sort().map(function (k) { return k.replace(/_/g, " ") + " " + f[k]; }).join(", ");
      }).catch(function () {});
      return Promise.all([annuaire, maire, siret, points]).then(function () { return a; });
    }).then(function (a) {
      // Champs de facturation : remplis seulement s'ils sont vides (vos saisies restent prioritaires).
      var vide = function (id) { return $(id) && !gVal(id); }, faits = [];
      if (vide("gf-nom")) { $("gf-nom").value = "Mairie de " + nom; faits.push("nom officiel"); }
      if (a._siret && vide("gf-siret")) { $("gf-siret").value = a._siret; faits.push("SIRET"); }
      if (a._adresse && vide("gf-adresse")) { $("gf-adresse").value = a._adresse; faits.push("adresse"); }
      if (a._cp && vide("gf-cp")) $("gf-cp").value = a._cp;
      if (a._ville && vide("gf-ville")) $("gf-ville").value = a._ville;
      if (a.email_mairie && vide("gf-email")) { $("gf-email").value = a.email_mairie; faits.push("e-mail de facturation"); }
      delete a._siret; delete a._adresse; delete a._cp; delete a._ville;
      G_AUTO = a; dessinerInfos(gClient(com));
      msg("msg-fiche", "Infos publiques trouvées" + (faits.length ? " ; complété : " + faits.join(", ") : "") + ". Vérifiez puis « Enregistrer la fiche ».", "ok");
    }).catch(function (e) { msg("msg-fiche", e.message, "ko"); });
  }
  var G_CONTACT = null, G_ECHANGE = null;
  function dessinerContacts() {
    var com = $("g-commune").value, l = (G.Contacts || []).filter(function (x) { return x.commune === com; });
    $("g-contacts").innerHTML = l.length ? l.map(function (x) {
      return '<div style="padding:6px 0;border-bottom:1px solid var(--trait)"><b>' + gEsc(x.nom) + '</b>' + (x.fonction ? ' — ' + gEsc(x.fonction) : '') + (x.facturation === "oui" ? ' <span class="petit">(facturation)</span>' : '')
        + '<br>' + [x.email ? '<a href="mailto:' + gEsc(x.email) + '">' + gEsc(x.email) + '</a>' : '', x.telephone ? '<a href="tel:' + gEsc(x.telephone) + '">' + gEsc(x.telephone) + '</a>' : ''].filter(Boolean).join(" · ")
        + ' <button class="second" type="button" data-gcontact="' + gEsc(x.id) + '" style="padding:3px 8px;font-size:12px;float:right">Modifier</button></div>';
    }).join("") : "Aucun contact pour cette commune.";
    formContact(G_CONTACT && G_CONTACT.commune === com ? G_CONTACT : null);
  }
  function formContact(x) {
    G_CONTACT = x; x = x || {};
    $("g-contact-form").innerHTML = '<b>' + (x.id ? "Modifier le contact" : "Ajouter un contact") + '</b>'
      + gChamp("gc-nom", "Nom", x.nom, "text", null, "ex. Mme Dupont")
      + gChamp("gc-fonction", "Fonction", x.fonction, "text", null, "maire, secrétaire de mairie, adjoint…")
      + gChamp("gc-email", "E-mail", x.email, "email") + gChamp("gc-tel", "Téléphone", x.telephone, "tel")
      + gChamp("gc-fact", "Destinataire des factures", x.facturation || "non", null, [["non", "Non"], ["oui", "Oui"]])
      + gChamp("gc-notes", "Notes", x.notes, "zone")
      + '<div style="display:flex;gap:8px;margin-top:10px">' + (x.id ? '<button class="second" type="button" id="gc-suppr" style="color:var(--ko)">Supprimer</button><button class="second" type="button" id="gc-annuler">Annuler</button>' : '')
      + '<button class="principal" type="button" id="gc-ok" style="margin-top:0;flex:1">' + (x.id ? "Enregistrer" : "Ajouter") + '</button></div>';
  }
  function dessinerEchanges() {
    var com = $("g-commune").value, l = (G.Echanges || []).filter(function (x) { return x.commune === com; })
      .sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    $("g-echanges").innerHTML = l.length ? l.map(function (x) {
      var afaire = x.fait !== "oui" && (x.prochaine_action || x.echeance);
      return '<div style="padding:6px 0;border-bottom:1px solid var(--trait)"><b>' + gDateFR(x.date) + ' · ' + gEsc(gLib(G_TYPES_ECH, x.type)) + '</b>' + (x.contact ? ' avec ' + gEsc(x.contact) : '')
        + '<br>' + gEsc(x.resume)
        + (x.prochaine_action || x.echeance ? '<br>→ ' + gEsc(x.prochaine_action || "") + (x.echeance ? ' (pour le ' + gDateFR(x.echeance) + ')' : '') + (afaire ? '' : ' <span style="color:var(--ok)">fait</span>') : '')
        + '<span style="float:right;display:flex;gap:4px">' + (afaire ? '<button class="second" type="button" data-gfait="' + gEsc(x.id) + '" style="padding:3px 8px;font-size:12px">Fait</button>' : '')
        + '<button class="second" type="button" data-gechange="' + gEsc(x.id) + '" style="padding:3px 8px;font-size:12px">Modifier</button></span></div>';
    }).join("") : "Aucun échange enregistré.";
    formEchange(G_ECHANGE && G_ECHANGE.commune === com ? G_ECHANGE : null);
  }
  function formEchange(x) {
    G_ECHANGE = x; x = x || {};
    var com = $("g-commune").value;
    var contacts = [["", "—"]].concat((G.Contacts || []).filter(function (c) { return c.commune === com; }).map(function (c) { return [c.nom, c.nom + (c.fonction ? " (" + c.fonction + ")" : "")]; }));
    if (x.contact && !contacts.some(function (c) { return c[0] === x.contact; })) contacts.push([x.contact, x.contact]);
    $("g-echange-form").innerHTML = '<b>' + (x.id ? "Modifier l'échange" : "Noter un échange") + '</b>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div>' + gChamp("ge-date", "Date", x.date || new Date().toISOString().slice(0, 10), "date") + '</div><div>' + gChamp("ge-type", "Type", x.type || "appel", null, G_TYPES_ECH) + '</div></div>'
      + gChamp("ge-contact", "Avec", x.contact || "", null, contacts)
      + gChamp("ge-resume", "Ce qui s'est dit", x.resume, "zone")
      + gChamp("ge-action", "Prochaine action", x.prochaine_action, "text", null, "ex. envoyer le devis, relancer le maire")
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div>' + gChamp("ge-echeance", "Pour le", x.echeance, "date") + '</div><div>' + gChamp("ge-fait", "Action faite", x.fait || "non", null, [["non", "Non"], ["oui", "Oui"]]) + '</div></div>'
      + '<div style="display:flex;gap:8px;margin-top:10px">' + (x.id ? '<button class="second" type="button" id="ge-suppr" style="color:var(--ko)">Supprimer</button><button class="second" type="button" id="ge-annuler">Annuler</button>' : '')
      + '<button class="principal" type="button" id="ge-ok" style="margin-top:0;flex:1">' + (x.id ? "Enregistrer" : "Ajouter") + '</button></div>';
  }
  // Réglages de prospection, rangés dans l'onglet Emetteur (créés à la première sauvegarde).
  var G_REGLAGES = [["tarif_point_defaut", "", "Réglage : tarif annuel HT par point pour estimer le potentiel d'un prospect (€)"],
    ["habitants_par_point", "300", "Réglage : habitants par point de collecte, pour estimer les points d'une commune non relevée"],
    ["carte_centre", "Albon", "Réglage : commune au centre de la carte des prospects"],
    ["carte_rayon_km", "20", "Réglage : rayon par défaut de la carte (km)"]];
  function gReglage(cle) {
    var l = ((G && G.Emetteur) || []).filter(function (p) { return p.cle === cle; })[0], d = G_REGLAGES.filter(function (r) { return r[0] === cle; })[0];
    var v = l && l.valeur && !/^À REMPLIR/i.test(l.valeur) ? l.valeur : "";
    return v || (d ? d[1] : "");
  }
  function dessinerEmetteur() {
    G.Emetteur = G.Emetteur || [];
    G_REGLAGES.forEach(function (r) { if (!G.Emetteur.some(function (p) { return p.cle === r[0]; })) G.Emetteur.push({ cle: r[0], valeur: r[1], description: r[2], local: true }); });
    $("g-emetteur").innerHTML = (G.Emetteur || []).map(function (p, i) {
      var vide = /^À REMPLIR/i.test(p.valeur || "");
      return '<label for="gm-' + i + '"><b>' + gEsc(p.cle) + '</b>' + (p.description ? ' <span class="petit">— ' + gEsc(p.description) + '</span>' : '') + '</label>'
        + '<input id="gm-' + i + '" data-cle="' + gEsc(p.cle) + '" data-avant="' + gEsc(p.local ? "" : p.valeur) + '" value="' + (vide ? "" : gEsc(p.valeur)) + '" placeholder="' + (vide ? "À REMPLIR" : "") + '"' + (vide ? ' style="border-color:#E6C39E;background:#FFFBF5"' : '') + '>';
    }).join("") || '<p class="petit">Onglet Emetteur vide.</p>';
  }
  function dessinerDocs() {
    var noms = {}; gCommunes().forEach(function (c) { noms[c[0]] = c[1]; });
    function liste(o, st) {
      var l = (G[o] || []).slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || "") || (b.numero || "").localeCompare(a.numero || ""); });
      return l.length ? '<table class="dns"><tr><th style="text-align:left">N°</th><th style="text-align:left">Commune</th><th style="text-align:left">Date</th><th style="text-align:left">Statut</th><th style="text-align:right">TTC</th></tr>'
        + l.map(function (d) { return '<tr><td><a href="#" data-gdoc="' + (o === "Devis" ? "devis" : "facture") + '" data-num="' + gEsc(d.numero) + '">' + gEsc(d.numero.indexOf("BROUILLON") === 0 ? "brouillon" : d.numero) + '</a></td><td>' + gEsc(noms[d.commune] || d.commune) + '</td><td>' + gDateFR(d.date) + '</td><td>' + gEsc(gLib(st, d.statut)) + '</td><td style="text-align:right">' + gEuros(d.total_ttc) + '</td></tr>'; }).join("") + '</table>'
        : "Aucun document.";
    }
    $("g-devis-liste").innerHTML = liste("Devis", G_ST_DEVIS);
    $("g-factures-liste").innerHTML = liste("Factures", G_ST_FACT);
  }

  /* Éditeur de devis / facture : en-tête + lignes, totaux recalculés à la saisie (le serveur recalcule aussi). */
  function ouvrirDoc(type, numero) {
    var o = type === "devis" ? "Devis" : "Factures";
    var d = numero ? (G[o] || []).filter(function (x) { return x.numero === numero; })[0] : null;
    d = d ? JSON.parse(JSON.stringify(d)) : { commune: $("g-commune").value || "", statut: "brouillon", date: new Date().toISOString().slice(0, 10), type: "forfait" };
    var lignes = numero ? (G.Lignes || []).filter(function (l) { return l.document === numero; }).sort(function (a, b) { return Number(a.num) - Number(b.num); }) : [];
    var verrou = type === "facture" && d.numero && d.statut !== "brouillon";
    G_DOC = { type: type, d: d, verrou: verrou };
    $("g-doc").hidden = false;
    $("g-doc-titre").textContent = (type === "devis" ? "Devis " : "Facture ") + (d.numero ? (d.numero.indexOf("BROUILLON") === 0 ? "(brouillon)" : d.numero) : "(nouveau)");
    var com = gCommunes();
    var h = gChamp("gd-commune", "Commune", d.commune, null, com) + gChamp("gd-date", "Date", d.date, "date");
    if (type === "devis") {
      h += gChamp("gd-objet", "Objet", d.objet, "text", null, "ex. Ouverture de 2 points de collecte")
        + gChamp("gd-statut", "Statut", d.statut, null, G_ST_DEVIS)
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div>' + gChamp("gd-accepte-le", "Accepté le", d.accepte_le, "date") + '</div><div>' + gChamp("gd-accepte-par", "Accepté par", d.accepte_par, "text", null, "nom et qualité") + '</div></div>'
        + gChamp("gd-points", "Points concernés", d.ref_points, "text", null, "codes séparés par des virgules, ex. AND-06, AND-07");
    } else {
      h += gChamp("gd-type", "Type", d.type || "forfait", null, G_TYPES_FACT)
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div>' + gChamp("gd-pdeb", "Période du", d.periode_debut, "date") + '</div><div>' + gChamp("gd-pfin", "au", d.periode_fin, "date") + '</div></div>'
        + gChamp("gd-devis", "Devis d'origine", d.ref_devis, null, [["", "—"]].concat((G.Devis || []).filter(function (x) { return x.commune === d.commune || x.numero === d.ref_devis; }).map(function (x) { return [x.numero, x.numero + " — " + (x.objet || "")]; })))
        + gChamp("gd-statut", "Statut", d.statut, null, G_ST_FACT, d.statut === "brouillon" ? "passer à « Émise » attribue le numéro définitif et fige la facture" : "")
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div>' + gChamp("gd-payee", "Payée le", d.payee_le, "date") + '</div><div>' + gChamp("gd-chorus", "Référence Chorus Pro", d.ref_chorus) + '</div></div>'
        + (d.echeance ? '<p class="petit">Échéance de paiement : <b>' + gDateFR(d.echeance) + '</b></p>' : '');
    }
    h += gChamp("gd-tva", "Taux de TVA (%)", d.taux_tva || (((G.Emetteur || []).filter(function (p) { return p.cle === "taux_tva"; })[0] || {}).valeur || "20"), "number")
      + gChamp("gd-notes", "Notes", d.notes, "zone");
    $("g-doc-entete").innerHTML = h;
    G_DOC.lignes = lignes.map(function (l) { return { designation: l.designation, site_code: l.site_code, quantite: l.quantite, prix_unitaire_ht: l.prix_unitaire_ht, periode_debut: l.periode_debut, periode_fin: l.periode_fin }; });
    if (!G_DOC.lignes.length && !verrou) G_DOC.lignes.push({ designation: "", site_code: "", quantite: 1, prix_unitaire_ht: "" });
    dessinerLignes();
    // Facture émise : seuls statut, paiement, référence Chorus et notes restent modifiables.
    Array.prototype.forEach.call($("g-doc-entete").querySelectorAll("input,select,textarea"), function (e) {
      if (verrou && ["gd-statut", "gd-payee", "gd-chorus", "gd-notes"].indexOf(e.id) < 0) e.disabled = true;
    });
    $("g-doc-ligne").hidden = verrou;
    $("g-doc-supprimer").hidden = !d.numero || d.statut !== "brouillon";
    cacher("msg-doc");
    $("g-doc").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function dessinerLignes() {
    var v = G_DOC.verrou;
    $("g-doc-lignes").innerHTML = G_DOC.lignes.map(function (l, i) {
      return '<div class="g-ligne" data-i="' + i + '" style="padding:8px 0;border-bottom:1px solid var(--trait)">'
        + '<input data-k="designation" placeholder="Désignation (ex. Point de collecte AND-06 — 2027)" value="' + gEsc(l.designation) + '"' + (v ? " disabled" : "") + '>'
        + '<div style="display:grid;grid-template-columns:1fr 70px 1fr 34px;gap:6px;margin-top:6px;align-items:center">'
        + '<input data-k="site_code" placeholder="Point" value="' + gEsc(l.site_code) + '"' + (v ? " disabled" : "") + '>'
        + '<input data-k="quantite" type="number" step="any" placeholder="Qté" value="' + gEsc(l.quantite) + '"' + (v ? " disabled" : "") + '>'
        + '<input data-k="prix_unitaire_ht" type="number" step="0.01" placeholder="PU HT €" value="' + gEsc(l.prix_unitaire_ht) + '"' + (v ? " disabled" : "") + '>'
        + (v ? '<span></span>' : '<button type="button" class="second" data-gsuppr-ligne="' + i + '" style="padding:6px;color:var(--ko)" aria-label="Retirer la ligne">×</button>') + '</div></div>';
    }).join("") || '<p class="petit">Aucune ligne.</p>';
    totauxDoc();
  }
  function totauxDoc() {
    var ht = 0; G_DOC.lignes.forEach(function (l) { ht += (Number(String(l.quantite).replace(",", ".")) || 0) * (Number(String(l.prix_unitaire_ht).replace(",", ".")) || 0); });
    var tva = Number(String(gVal("gd-tva")).replace(",", ".")) || 0;
    $("g-doc-totaux").innerHTML = "Total HT <b>" + gEuros(ht) + "</b> · TVA " + tva + " % · Total TTC <b>" + gEuros(ht * (1 + tva / 100)) + "</b>";
  }
  function enregistrerDoc() {
    var d = G_DOC.d, t = G_DOC.type, e = { numero: d.numero || "" };
    var champs = t === "devis"
      ? { commune: "gd-commune", date: "gd-date", objet: "gd-objet", statut: "gd-statut", accepte_le: "gd-accepte-le", accepte_par: "gd-accepte-par", ref_points: "gd-points", taux_tva: "gd-tva", notes: "gd-notes" }
      : { commune: "gd-commune", date: "gd-date", type: "gd-type", periode_debut: "gd-pdeb", periode_fin: "gd-pfin", ref_devis: "gd-devis", statut: "gd-statut", payee_le: "gd-payee", ref_chorus: "gd-chorus", taux_tva: "gd-tva", notes: "gd-notes" };
    Object.keys(champs).forEach(function (k) { if ($(champs[k])) e[k] = gVal(champs[k]); });
    if (t === "facture" && d.statut === "brouillon" && e.statut !== "brouillon"
      && !confirm("Émettre cette facture ?\n\nElle reçoit son numéro définitif et ne pourra plus être modifiée ni supprimée (seulement annulée par un avoir).")) return;
    var donnees = { op: "document", type: t, entete: e };
    if (!G_DOC.verrou) donnees.lignes = G_DOC.lignes;
    gEnvoyer(donnees, "msg-doc", "Enregistré.").then(function (j) {
      var n = j.document && j.document.numero;
      if (n) ouvrirDoc(t, n);
      msg("msg-doc", "Enregistré" + (n && n.indexOf("BROUILLON") !== 0 ? " : " + n : "") + ".", "ok");
    }).catch(function () {});
  }

  // — Événements —
  $("g-recharger").addEventListener("click", function () { chargerGestion(); });
  Array.prototype.forEach.call(document.querySelectorAll("nav button"), function (b) {
    if (b.dataset.onglet === "clients" || b.dataset.onglet === "factu") b.addEventListener("click", function () { if (!G_CHARGE) chargerGestion(); });
  });
  $("g-commune").addEventListener("change", function () { G_CONTACT = null; G_ECHANGE = null; G_AUTO = null; cacher("msg-fiche"); dessinerFiche(); });
  $("g-pipeline").addEventListener("click", function (e) {
    var a = e.target.closest("[data-gcom]"); if (!a) return; e.preventDefault();
    $("g-commune").value = a.dataset.gcom; G_CONTACT = null; G_ECHANGE = null; G_AUTO = null; dessinerFiche();
    $("g-commune").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("g-fiche").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "gf-auto") { rechercherInfos(); return; }
    if (b.id === "gf-maire") {
      var x = G_AUTO || gClient($("g-commune").value);
      b.disabled = true; b.textContent = "Ajout en cours…";
      gEnvoyer({ op: "enregistrer", onglet: "Contacts", valeurs: { commune: $("g-commune").value, nom: x.maire, fonction: "maire", email: x.email_mairie || "", telephone: x.telephone_mairie || "", facturation: "non", notes: "Ajouté depuis le Répertoire national des élus" + (x.maire_depuis ? " (maire depuis le " + gDateFR(x.maire_depuis) + ")" : "") } }, "msg-contact", "Maire ajouté aux contacts.")
        .then(function () { msg("msg-fiche", "Maire ajouté aux contacts (carte Contacts ci-dessous).", "ok"); $("g-contacts").scrollIntoView({ behavior: "smooth", block: "center" }); })
        .catch(function (er) { msg("msg-fiche", "Ajout du maire impossible : " + er.message, "ko"); b.disabled = false; b.textContent = "Ajouter le maire aux contacts"; });
    }
  });
  $("g-fiche-ok").addEventListener("click", function () {
    var com = $("g-commune").value; if (!com) return;
    var v = { commune: com, statut: gVal("gf-statut"), nom_officiel: gVal("gf-nom"), siret: gVal("gf-siret"), code_service_chorus: gVal("gf-chorus"), adresse_facturation: gVal("gf-adresse"), code_postal: gVal("gf-cp"), ville: gVal("gf-ville"), email_facturation: gVal("gf-email"), date_contrat: gVal("gf-date"), notes: gVal("gf-notes") };
    if (G_AUTO) G_INFOS.forEach(function (k) { if (G_AUTO[k] !== undefined) v[k] = String(G_AUTO[k]); });
    G_AUTO = null;
    gEnvoyer({ op: "enregistrer", onglet: "Clients", valeurs: v }, "msg-fiche", "Fiche enregistrée.").catch(function () {});
  });
  $("g-contacts").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gcontact]"); if (!b) return;
    formContact((G.Contacts || []).filter(function (x) { return x.id === b.dataset.gcontact; })[0] || null);
    $("g-contact-form").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("g-contact-form").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "gc-annuler") { formContact(null); return; }
    if (b.id === "gc-suppr") { if (!confirm("Supprimer ce contact ?")) return; gEnvoyer({ op: "supprimer", onglet: "Contacts", cle: G_CONTACT.id }, "msg-contact", "Contact supprimé.").then(function () { G_CONTACT = null; dessinerContacts(); }).catch(function () {}); return; }
    if (b.id === "gc-ok") {
      var v = { id: G_CONTACT ? G_CONTACT.id : "", commune: $("g-commune").value, nom: gVal("gc-nom"), fonction: gVal("gc-fonction"), email: gVal("gc-email"), telephone: gVal("gc-tel"), facturation: gVal("gc-fact"), notes: gVal("gc-notes") };
      if (!v.nom) { msg("msg-contact", "Indiquez le nom du contact.", "ko"); return; }
      gEnvoyer({ op: "enregistrer", onglet: "Contacts", valeurs: v }, "msg-contact", "Contact enregistré.").then(function () { G_CONTACT = null; dessinerContacts(); }).catch(function () {});
    }
  });
  $("g-echanges").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var x = (G.Echanges || []).filter(function (y) { return y.id === (b.dataset.gfait || b.dataset.gechange); })[0]; if (!x) return;
    if (b.dataset.gfait) { gEnvoyer({ op: "enregistrer", onglet: "Echanges", valeurs: { id: x.id, fait: "oui" } }, "msg-echange", "Action notée comme faite.").catch(function () {}); return; }
    formEchange(x); $("g-echange-form").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("g-echange-form").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "ge-annuler") { formEchange(null); return; }
    if (b.id === "ge-suppr") { if (!confirm("Supprimer cet échange ?")) return; gEnvoyer({ op: "supprimer", onglet: "Echanges", cle: G_ECHANGE.id }, "msg-echange", "Échange supprimé.").then(function () { G_ECHANGE = null; dessinerEchanges(); }).catch(function () {}); return; }
    if (b.id === "ge-ok") {
      var v = { id: G_ECHANGE ? G_ECHANGE.id : "", commune: $("g-commune").value, date: gVal("ge-date"), type: gVal("ge-type"), contact: gVal("ge-contact"), resume: gVal("ge-resume"), prochaine_action: gVal("ge-action"), echeance: gVal("ge-echeance"), fait: gVal("ge-fait") };
      if (!v.resume) { msg("msg-echange", "Résumez l'échange en une phrase.", "ko"); return; }
      gEnvoyer({ op: "enregistrer", onglet: "Echanges", valeurs: v }, "msg-echange", "Échange enregistré.").then(function () { G_ECHANGE = null; dessinerEchanges(); }).catch(function () {});
    }
  });
  $("g-emetteur-ok").addEventListener("click", function () {
    var modifs = Array.prototype.filter.call($("g-emetteur").querySelectorAll("input[data-cle]"), function (i) {
      var avant = i.dataset.avant || ""; return i.value.trim() !== (/^À REMPLIR/i.test(avant) ? "" : avant);
    });
    if (!modifs.length) { msg("msg-emetteur", "Aucune modification.", "info"); return; }
    msg("msg-emetteur", "Enregistrement…");
    var suite = Promise.resolve();
    modifs.forEach(function (i) { suite = suite.then(function () { return api("gestion", { op: "enregistrer", onglet: "Emetteur", valeurs: { cle: i.dataset.cle, valeur: i.value.trim() || "À REMPLIR" } }); }); });
    suite.then(function () { msg("msg-emetteur", modifs.length + " information(s) enregistrée(s).", "ok"); return chargerGestion(true); })
      .catch(function (er) { msg("msg-emetteur", er.message, "ko"); });
  });
  $("g-devis-nouveau").addEventListener("click", function () { ouvrirDoc("devis", ""); });
  $("g-facture-nouvelle").addEventListener("click", function () { ouvrirDoc("facture", ""); });
  ["g-devis-liste", "g-factures-liste"].forEach(function (id) {
    $(id).addEventListener("click", function (e) { var a = e.target.closest("[data-gdoc]"); if (!a) return; e.preventDefault(); ouvrirDoc(a.dataset.gdoc, a.dataset.num); });
  });
  $("g-doc-lignes").addEventListener("input", function (e) {
    var k = e.target.dataset.k, box = e.target.closest(".g-ligne"); if (!k || !box) return;
    G_DOC.lignes[Number(box.dataset.i)][k] = e.target.value; totauxDoc();
  });
  $("g-doc-lignes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gsuppr-ligne]"); if (!b) return;
    G_DOC.lignes.splice(Number(b.dataset.gsupprLigne), 1); dessinerLignes();
  });
  $("g-doc-entete").addEventListener("input", function (e) { if (e.target.id === "gd-tva") totauxDoc(); });
  $("g-doc-ligne").addEventListener("click", function () {
    var com = gVal("gd-commune"), ct = (G.communes || []).filter(function (x) { return x.commune === com; })[0] || {};
    G_DOC.lignes.push({ designation: "", site_code: "", quantite: 1, prix_unitaire_ht: ct.tarif_point || "" }); dessinerLignes();
  });
  $("g-doc-fermer").addEventListener("click", function () { $("g-doc").hidden = true; G_DOC = null; });
  $("g-doc-ok").addEventListener("click", enregistrerDoc);
  $("g-doc-supprimer").addEventListener("click", function () {
    if (!G_DOC || !G_DOC.d.numero || !confirm("Supprimer ce brouillon ?")) return;
    gEnvoyer({ op: "supprimer-document", type: G_DOC.type, numero: G_DOC.d.numero }, "msg-doc", "Brouillon supprimé.").then(function () { $("g-doc").hidden = true; G_DOC = null; }).catch(function () {});
  });


  /* ——— Potentiel d'une commune : points connus (Referentiel) ou estimés (habitants), × tarif ——— */
  function gPotentiel(com) {
    var c = gClient(com), ct = (G.communes || []).filter(function (x) { return x.commune === com; })[0] || {};
    var connus = (Number(c.nb_points) || 0) + (Number(c.nb_points_a_verifier) || 0);
    var hpp = Number(String(gReglage("habitants_par_point")).replace(",", ".")) || 300;
    var tarif = Number(String(ct.tarif_point || gReglage("tarif_point_defaut") || "").replace(",", ".")) || 0;
    if (connus) return { points: connus, estime: false, base: "points du Referentiel", tarif: tarif };
    var pop = Number(c.population) || 0;
    if (pop) return { points: Math.max(1, Math.ceil(pop / hpp)), estime: true, base: pop.toLocaleString("fr-FR") + " hab. ÷ " + hpp, tarif: tarif };
    return { points: 0, estime: true, base: "population inconnue : « Rechercher automatiquement »", tarif: tarif };
  }

  /* ——— Sections Carte et Agenda ——— */
  var G_COULEURS = { aucun: "#9AA39B", prospect: "#2F6EA8", demo: "#7B4FA3", devis: "#E08A00", client: "#2E7D4F", suspendu: "#B3261E", perdu: "#5E6B63" };
  main.insertAdjacentHTML("beforeend",
    '<section id="carte"><div class="carte">'
    + '<h2>Communes autour de moi</h2>'
    + '<div style="display:grid;grid-template-columns:1fr 110px;gap:8px">'
    + '<div><label for="gk-centre"><b>Centre</b></label><input id="gk-centre" placeholder="Albon"></div>'
    + '<div><label for="gk-rayon"><b>Rayon</b></label><select id="gk-rayon">' + [5, 10, 15, 20, 30, 40, 50, 75].map(function (k) { return '<option value="' + k + '">' + k + ' km</option>'; }).join("") + '</select></div></div>'
    + '<div style="display:flex;gap:8px;margin-top:10px"><button class="second" type="button" id="gk-moi">Ma position</button><button class="principal" type="button" id="gk-ok" style="margin-top:0;flex:1">Afficher</button></div>'
    + '<div id="gk-carte" style="height:62vh;min-height:360px;margin-top:12px;border-radius:10px;border:1px solid var(--trait)"></div>'
    + '<div id="gk-legende" class="petit" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:10px"></div>'
    + '<div class="msg" id="msg-carte"></div>'
    + '<p class="petit" style="margin-top:8px">Un clic sur une commune affiche ses habitants et son potentiel ; « Ouvrir la fiche » la crée comme prospect si elle n\'est pas encore suivie (elle n\'est enregistrée qu\'avec « Enregistrer la fiche »).</p>'
    + '</div></section>'
    + '<section id="agenda"><div class="carte">'
    + '<h2>Agenda des actions</h2>'
    + '<div style="display:flex;align-items:center;gap:8px"><button class="second" type="button" id="ga-prec" aria-label="Mois précédent">‹</button><b id="ga-mois" style="flex:1;text-align:center"></b><button class="second" type="button" id="ga-suiv" aria-label="Mois suivant">›</button></div>'
    + '<div id="ga-grille" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:8px"></div>'
    + '<div id="ga-retard" style="margin-top:12px"></div>'
    + '<div id="ga-liste" class="petit" style="margin-top:12px"></div>'
    + '</div></section>');

  /* ——— Carte : Leaflet (chargé à la demande), communes de geo.api.gouv.fr dans le rayon ——— */
  var GK = { carte: null, couche: null, communes: null, chargeL: null };
  function chargerLeaflet() {
    if (window.L) return Promise.resolve();
    if (GK.chargeL) return GK.chargeL;
    GK.chargeL = new Promise(function (ok, ko) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l);
      var s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = ok; s.onerror = function () { ko(new Error("Carte indisponible (chargement de Leaflet).")); };
      document.head.appendChild(s);
    });
    return GK.chargeL;
  }
  function toutesCommunes() {
    if (GK.communes) return Promise.resolve(GK.communes);
    msg("msg-carte", "Chargement des communes…");
    return gJson("https://geo.api.gouv.fr/communes?fields=nom,code,centre,population,codeDepartement,codesPostaux&format=json").then(function (l) {
      GK.communes = l.filter(function (c) { return c.centre && c.centre.coordinates; }); cacher("msg-carte"); return GK.communes;
    });
  }
  function slugCommune(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function distKm(a, b) {
    var r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
    var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  // Retrouve la fiche suivie d'une commune de la carte : par code INSEE, sinon par identifiant (nom normalisé).
  function suivie(c) {
    var cl = (G.Clients || []).filter(function (x) { return x.code_insee === c.code; })[0];
    var id = cl ? cl.commune : slugCommune(c.nom);
    var connue = (G.communes || []).some(function (x) { return x.commune === id; });
    if (!cl) cl = (G.Clients || []).filter(function (x) { return x.commune === id && (!x.code_insee || x.code_insee === c.code); })[0];
    return { id: id, client: cl || null, connue: connue, statut: cl ? (cl.statut || "prospect") : (connue ? "client" : "aucun") };
  }
  var GK_CENTRE = null;
  function ouvrirCarteProspects(centreForce) {
    if (!$("gk-centre").value) $("gk-centre").value = gReglage("carte_centre") || "Albon";
    if (!$("gk-rayon").dataset.init) { $("gk-rayon").value = String(Number(gReglage("carte_rayon_km")) || 20); $("gk-rayon").dataset.init = "1"; }
    $("gk-legende").innerHTML = [["aucun", "pas encore en relation"]].concat(G_STATUTS).map(function (s) {
      return '<span><span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' + G_COULEURS[s[0]] + ';margin-right:4px;vertical-align:-1px"></span>' + gEsc(s[1]) + '</span>';
    }).join("");
    Promise.all([chargerLeaflet(), toutesCommunes()]).then(function () {
      var rayon = Number($("gk-rayon").value) || 20, centre = centreForce || GK_CENTRE;
      if (!centre) {
        var nomC = slugCommune($("gk-centre").value);
        var c0 = GK.communes.filter(function (c) { return slugCommune(c.nom) === nomC; }).sort(function (a, b) { return (b.population || 0) - (a.population || 0); })[0];
        if (!c0) throw new Error("Commune de centre introuvable : « " + $("gk-centre").value + " ».");
        centre = [c0.centre.coordinates[1], c0.centre.coordinates[0]];
      }
      GK_CENTRE = centre;
      if (!GK.carte) {
        GK.carte = L.map("gk-carte");
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(GK.carte);
      }
      if (GK.couche) GK.couche.remove();
      GK.couche = L.layerGroup().addTo(GK.carte);
      L.circle(centre, { radius: rayon * 1000, color: "#1F3A2E", weight: 1, fill: false, dashArray: "4 4" }).addTo(GK.couche);
      var proches = GK.communes.map(function (c) { return { c: c, d: distKm(centre, [c.centre.coordinates[1], c.centre.coordinates[0]]) }; })
        .filter(function (x) { return x.d <= rayon; });
      proches.forEach(function (x) {
        var c = x.c, s = suivie(c), pos = [c.centre.coordinates[1], c.centre.coordinates[0]];
        var r = Math.max(5, Math.min(16, 3 + Math.sqrt(c.population || 0) / 9));
        var m = L.circleMarker(pos, { radius: r, color: s.statut === "aucun" ? "#7d857e" : "#fff", weight: s.statut === "aucun" ? 1 : 2, fillColor: G_COULEURS[s.statut] || G_COULEURS.aucun, fillOpacity: s.statut === "aucun" ? 0.45 : 0.95 }).addTo(GK.couche);
        var hpp = Number(gReglage("habitants_par_point")) || 300, tarif = Number(String(gReglage("tarif_point_defaut")).replace(",", ".")) || 0;
        var pts = s.client && (Number(s.client.nb_points) || 0) ? Number(s.client.nb_points) : Math.max(1, Math.ceil((c.population || 0) / hpp));
        m.bindPopup('<b>' + gEsc(c.nom) + '</b> (' + gEsc(c.codeDepartement) + ')<br>' + (c.population || 0).toLocaleString("fr-FR") + ' habitants · ' + x.d.toFixed(1) + ' km'
          + '<br>Statut : <b>' + gEsc(s.statut === "aucun" ? "pas en relation" : gLib(G_STATUTS, s.statut)) + '</b>'
          + '<br>Potentiel : ' + pts + ' point(s)' + (tarif ? ' ≈ ' + gEuros(pts * tarif) + ' HT/an' : '')
          + '<br><button type="button" class="second" data-gk-ouvrir="' + gEsc(c.code) + '" style="margin-top:6px;padding:4px 10px;font-size:13px">Ouvrir la fiche</button>');
      });
      GK.carte.setView(centre, rayon <= 10 ? 12 : rayon <= 20 ? 11 : rayon <= 40 ? 10 : 9);
      setTimeout(function () { GK.carte.invalidateSize(); }, 50);
      msg("msg-carte", proches.length + " communes dans un rayon de " + rayon + " km, dont " + proches.filter(function (x) { return suivie(x.c).statut !== "aucun"; }).length + " suivies.", "info");
    }).catch(function (e) { msg("msg-carte", e.message, "ko"); });
  }
  // « Ouvrir la fiche » : commune suivie → sa fiche ; sinon prospect préparé (non enregistré).
  $("gk-carte").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gk-ouvrir]"); if (!b) return;
    var c = (GK.communes || []).filter(function (x) { return x.code === b.dataset.gkOuvrir; })[0]; if (!c) return;
    var s = suivie(c);
    if (!s.client && !s.connue) {
      G.Clients.push({ commune: s.id, statut: "prospect", nom_officiel: "Mairie de " + c.nom, ville: c.nom, code_insee: c.code, population: String(c.population || ""), code_postal: (c.codesPostaux || [])[0] || "" });
    }
    dessinerGestion();
    $("g-commune").value = s.id; G_CONTACT = null; G_ECHANGE = null;
    G_AUTO = (!s.client && !s.connue) ? { code_insee: c.code, population: String(c.population || "") } : null; dessinerFiche();
    var nb = Array.prototype.filter.call(document.querySelectorAll("nav button"), function (x) { return x.dataset.onglet === "clients"; })[0];
    if (nb) nb.click();
    if (!s.client && !s.connue) msg("msg-fiche", "Nouveau prospect préparé : « Rechercher automatiquement » puis « Enregistrer la fiche » pour le suivre.", "info");
    $("g-commune").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("gk-ok").addEventListener("click", function () { GK_CENTRE = null; ouvrirCarteProspects(); });
  $("gk-rayon").addEventListener("change", function () { ouvrirCarteProspects(); });
  $("gk-moi").addEventListener("click", function () {
    if (!navigator.geolocation) { msg("msg-carte", "Géolocalisation indisponible sur cet appareil.", "ko"); return; }
    msg("msg-carte", "Recherche de votre position…");
    navigator.geolocation.getCurrentPosition(function (p) { $("gk-centre").value = "Ma position"; GK_CENTRE = [p.coords.latitude, p.coords.longitude]; ouvrirCarteProspects(GK_CENTRE); },
      function () { msg("msg-carte", "Position refusée ou indisponible.", "ko"); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  /* ——— Agenda : actions prévues (échanges), devis à relancer, factures à échéance, anniversaires de contrat ——— */
  var GA_MOIS = new Date(); GA_MOIS.setDate(1);
  function evenements() {
    var ev = [], noms = {}; gCommunes().forEach(function (c) { noms[c[0]] = c[1]; });
    var auj = new Date().toISOString().slice(0, 10);
    (G.Echanges || []).forEach(function (e) {
      if (e.echeance && e.fait !== "oui") ev.push({ date: e.echeance, type: "action", couleur: "#E08A00", titre: e.prochaine_action || e.resume, commune: e.commune, retard: e.echeance < auj, id: e.id });
      if (e.date) ev.push({ date: e.date, type: "echange", couleur: "#2F6EA8", titre: gLib(G_TYPES_ECH, e.type) + (e.contact ? " avec " + e.contact : "") + " : " + e.resume, commune: e.commune, passe: true });
      if (e.echeance && e.fait === "oui") ev.push({ date: e.echeance, type: "fait", couleur: "#2E7D4F", titre: "✓ " + (e.prochaine_action || e.resume), commune: e.commune, passe: true });
    });
    (G.Devis || []).forEach(function (d) { if (d.validite && (d.statut === "envoye" || d.statut === "brouillon")) ev.push({ date: d.validite, type: "devis", couleur: "#7B4FA3", titre: "Fin de validité du devis " + d.numero + (d.statut === "envoye" ? " — relancer" : " (brouillon)"), commune: d.commune, retard: d.validite < auj && d.statut === "envoye", doc: ["devis", d.numero] }); });
    (G.Factures || []).forEach(function (f) { if (f.echeance && (f.statut === "emise" || f.statut === "deposee_chorus")) ev.push({ date: f.echeance, type: "facture", couleur: "#B3261E", titre: "Échéance de la facture " + f.numero + " (" + gEuros(f.total_ttc) + ")", commune: f.commune, retard: f.echeance < auj, doc: ["facture", f.numero] }); });
    (G.communes || []).forEach(function (c) {
      if (!c.anniversaire) return;
      var a = String(c.anniversaire).slice(5, 10), an = new Date().getFullYear();
      [an, an + 1].forEach(function (y) { ev.push({ date: y + "-" + a, type: "anniversaire", couleur: "#2E7D4F", titre: "Anniversaire du contrat — forfait annuel à facturer", commune: c.commune }); });
    });
    ev.forEach(function (x) { x.nomCommune = noms[x.commune] || x.commune || ""; });
    return ev.sort(function (a, b) { return a.date.localeCompare(b.date); });
  }
  function ligneEv(x) {
    return '<div data-ga-com="' + gEsc(x.commune) + '"' + (x.doc ? ' data-ga-doc="' + gEsc(x.doc[0]) + '" data-ga-num="' + gEsc(x.doc[1]) + '"' : '') + ' style="padding:6px 0;border-bottom:1px solid var(--trait);cursor:pointer' + (x.retard ? ';color:var(--ko)' : '') + '">'
      + '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + x.couleur + ';margin-right:6px"></span>'
      + '<b>' + gDateFR(x.date) + '</b> · ' + gEsc(x.nomCommune) + ' — ' + gEsc(x.titre) + '</div>';
  }
  function dessinerAgenda() {
    if (!$("ga-grille")) return;
    var ev = evenements(), auj = new Date().toISOString().slice(0, 10);
    var an = GA_MOIS.getFullYear(), mo = GA_MOIS.getMonth();
    $("ga-mois").textContent = GA_MOIS.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    var premier = new Date(an, mo, 1), decal = (premier.getDay() + 6) % 7, nbj = new Date(an, mo + 1, 0).getDate();
    var h = ["L", "M", "M", "J", "V", "S", "D"].map(function (j) { return '<div class="petit" style="text-align:center;font-weight:700">' + j + '</div>'; }).join("");
    for (var i = 0; i < decal; i++) h += '<div></div>';
    for (var j = 1; j <= nbj; j++) {
      var d = an + "-" + String(mo + 1).padStart(2, "0") + "-" + String(j).padStart(2, "0");
      var duJour = ev.filter(function (x) { return x.date === d; });
      h += '<div data-ga-jour="' + d + '" style="min-height:44px;padding:3px;border-radius:7px;border:1px solid ' + (d === auj ? "var(--accent)" : "var(--trait)") + ';background:#fff;cursor:' + (duJour.length ? "pointer" : "default") + '">'
        + '<div class="petit" style="font-weight:' + (d === auj ? 700 : 400) + '">' + j + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:2px">' + duJour.slice(0, 6).map(function (x) { return '<span title="' + gEsc(x.titre) + '" style="width:8px;height:8px;border-radius:50%;background:' + x.couleur + '"></span>'; }).join("") + '</div></div>';
    }
    $("ga-grille").innerHTML = h;
    var retards = ev.filter(function (x) { return x.retard; });
    $("ga-retard").innerHTML = retards.length ? '<b style="color:var(--ko)">En retard (' + retards.length + ')</b><div class="petit">' + retards.map(ligneEv).join("") + '</div>' : "";
    var debut = an + "-" + String(mo + 1).padStart(2, "0") + "-01", fin = an + "-" + String(mo + 1).padStart(2, "0") + "-31";
    var duMois = ev.filter(function (x) { return x.date >= debut && x.date <= fin; });
    $("ga-liste").innerHTML = '<b>' + gEsc($("ga-mois").textContent) + ' — ' + duMois.length + ' élément(s)</b>' + (duMois.map(ligneEv).join("") || '<p>Rien ce mois-ci.</p>');
  }
  $("ga-prec").addEventListener("click", function () { GA_MOIS.setMonth(GA_MOIS.getMonth() - 1); dessinerAgenda(); });
  $("ga-suiv").addEventListener("click", function () { GA_MOIS.setMonth(GA_MOIS.getMonth() + 1); dessinerAgenda(); });
  $("ga-grille").addEventListener("click", function (e) {
    var c = e.target.closest("[data-ga-jour]"); if (!c) return;
    var d = c.dataset.gaJour, l = evenements().filter(function (x) { return x.date === d; });
    if (!l.length) return;
    $("ga-liste").innerHTML = '<b>' + gDateFR(d) + '</b>' + l.map(ligneEv).join("") + '<p><a href="#" id="ga-tout">Tout le mois</a></p>';
  });
  function ouvrirDepuisAgenda(e) {
    if (e.target.id === "ga-tout") { e.preventDefault(); dessinerAgenda(); return; }
    var l = e.target.closest("[data-ga-com]"); if (!l) return;
    if (l.dataset.gaDoc) {
      var nf = Array.prototype.filter.call(document.querySelectorAll("nav button"), function (x) { return x.dataset.onglet === "factu"; })[0];
      if (nf) nf.click(); ouvrirDoc(l.dataset.gaDoc, l.dataset.gaNum); return;
    }
    var nb = Array.prototype.filter.call(document.querySelectorAll("nav button"), function (x) { return x.dataset.onglet === "clients"; })[0];
    if (nb) nb.click();
    $("g-commune").value = l.dataset.gaCom; G_CONTACT = null; G_ECHANGE = null; G_AUTO = null; dessinerFiche();
    $("g-echanges").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  $("ga-liste").addEventListener("click", ouvrirDepuisAgenda);
  $("ga-retard").addEventListener("click", ouvrirDepuisAgenda);

})();
