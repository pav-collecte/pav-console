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
  [["clients", "Clients"], ["carte", "Carte"], ["agenda", "Agenda"], ["tarifs", "Tarifs"], ["factu", "Factures"], ["avis", "Avis"]].forEach(function (o) {
    var b = document.createElement("button"); b.dataset.onglet = o[0]; b.textContent = o[1]; nav.appendChild(b);
  });
  main.insertAdjacentHTML("beforeend", "  <section id=\"clients\">\n    <div class=\"carte\">\n      <h2>Suivi des communes <button class=\"second\" id=\"g-recharger\" type=\"button\" style=\"float:right;padding:4px 10px;font-size:13px\">Actualiser</button></h2>\n      <p class=\"petit\">Une ligne par commune : o\u00f9 en est la relation, et la prochaine action pr\u00e9vue.</p>\n      <div id=\"g-pipeline\" class=\"petit\">\u2014</div>\n      <div class=\"msg\" id=\"msg-gestion\"></div>\n    </div>\n    <div class=\"carte\">\n      <h2>Fiche client</h2>\n      <label for=\"g-commune\"><b>Commune</b></label>\n      <select id=\"g-commune\"></select>\n      <div id=\"g-contrat\" class=\"petit\" style=\"margin-top:8px\"></div>\n      <div id=\"g-fiche\"></div>\n      <button class=\"principal\" id=\"g-fiche-ok\" type=\"button\">Enregistrer la fiche</button>\n      <div class=\"msg\" id=\"msg-fiche\"></div>\n    </div>\n    <div class=\"carte\">\n      <h2>Contacts</h2>\n      <div id=\"g-contacts\" class=\"petit\"></div>\n      <div id=\"g-contact-form\" style=\"margin-top:10px;padding-top:10px;border-top:1px solid var(--trait)\"></div>\n      <div class=\"msg\" id=\"msg-contact\"></div>\n    </div>\n    <div class=\"carte\">\n      <h2>\u00c9changes</h2>\n      <p class=\"petit\">Appels, r\u00e9unions, d\u00e9monstrations, relances\u2026 et la prochaine action \u00e0 faire.</p>\n      <div id=\"g-echanges\" class=\"petit\"></div>\n      <div id=\"g-echange-form\" style=\"margin-top:10px;padding-top:10px;border-top:1px solid var(--trait)\"></div>\n      <div class=\"msg\" id=\"msg-echange\"></div>\n    </div>\n  </section>\n\n  <section id=\"factu\">\n    <div class=\"carte\">\n      <h2>\u00c9metteur des devis et factures</h2>\n      <p class=\"petit\">Ces informations figureront sur chaque document. Tant que des champs sont \u00ab \u00c0 REMPLIR \u00bb, les documents restent des brouillons sans valeur.</p>\n      <div id=\"g-emetteur\"></div>\n      <button class=\"principal\" id=\"g-emetteur-ok\" type=\"button\">Enregistrer l'\u00e9metteur</button>\n      <div class=\"msg\" id=\"msg-emetteur\"></div>\n    </div>\n    <div class=\"carte\">\n      <h2>Devis <button class=\"second\" id=\"g-devis-nouveau\" type=\"button\" style=\"float:right;padding:4px 10px;font-size:13px\">Nouveau devis</button></h2>\n      <div id=\"g-devis-liste\" class=\"petit\">\u2014</div>\n    </div>\n    <div class=\"carte\">\n      <h2>Factures <button class=\"second\" id=\"g-facture-nouvelle\" type=\"button\" style=\"float:right;padding:4px 10px;font-size:13px\">Nouvelle facture</button></h2>\n      <div id=\"g-factures-liste\" class=\"petit\">\u2014</div>\n    </div>\n    <div class=\"carte\" id=\"g-doc\" hidden>\n      <h2 id=\"g-doc-titre\">Document</h2>\n      <div id=\"g-doc-entete\"></div>\n      <h2 style=\"margin-top:14px\">Lignes</h2>\n      <div id=\"g-doc-lignes\"></div>\n      <button class=\"second\" id=\"g-doc-ligne\" type=\"button\" style=\"margin-top:8px\">+ Ajouter une ligne</button>\n      <div id=\"g-doc-totaux\" class=\"petit\" style=\"margin-top:10px;text-align:right;font-size:15px\"></div>\n      <div class=\"msg\" id=\"msg-doc\"></div>\n      <div style=\"display:flex;gap:8px;margin-top:12px;flex-wrap:wrap\">\n        <button class=\"second\" id=\"g-doc-fermer\" type=\"button\" style=\"flex:1\">Fermer</button>\n        <button class=\"second\" id=\"g-doc-pdf\" type=\"button\" style=\"flex:1\">Aperçu / PDF</button>\n        <button class=\"second\" id=\"g-doc-supprimer\" type=\"button\" style=\"flex:1;color:var(--ko)\">Supprimer le brouillon</button>\n        <button class=\"principal\" id=\"g-doc-ok\" type=\"button\" style=\"flex:2;margin-top:0\">Enregistrer</button>\n      </div>\n    </div>\n  </section>\n");
  // Bascule d'onglet pour les deux nouveaux boutons (les autres sont gérés par la console).
  Array.prototype.forEach.call(nav.querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () {
      if (["clients", "carte", "agenda", "tarifs", "factu", "avis"].indexOf(b.dataset.onglet) < 0) return;
      Array.prototype.forEach.call(nav.querySelectorAll("button"), function (x) { x.classList.toggle("actif", x === b); });
      Array.prototype.forEach.call(document.querySelectorAll("main > section"), function (s) { s.classList.toggle("actif", s.id === b.dataset.onglet); });
      if (!G_CHARGE) chargerGestion(); else if (b.dataset.onglet === "carte") ouvrirCarteProspects(); else if (b.dataset.onglet === "agenda") dessinerAgenda(); else if (b.dataset.onglet === "avis") dessinerAvis();
    });
  });
  // Smartphone : la barre d'onglets défile, l'onglet choisi est ramené au centre.
  nav.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && b.scrollIntoView) b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); });
  /* — Clients (CRM) et facturation : fiches, contacts, échanges, émetteur, devis, factures.
     Données dans le classeur commun (onglets créés par n8n au premier chargement). — */
  var G = null, G_CHARGE = false, G_DOC = null;
  var G_STATUTS = [["prospect", "Prospect"], ["demo", "Démo faite"], ["devis", "Devis en cours"], ["client", "Client"], ["suspendu", "Suspendu"], ["perdu", "Perdu"]];
  var G_TYPES_ECH = [["appel", "Appel"], ["email", "E-mail"], ["reunion", "Réunion"], ["demo", "Démonstration"], ["relance", "Relance"], ["courrier", "Courrier"], ["autre", "Autre"]];
  var G_ST_DEVIS = [["brouillon", "Brouillon"], ["envoye", "Soumis (envoyé)"], ["accepte", "Accepté"], ["refuse", "Refusé"], ["expire", "Expiré"]];
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
  function gNomCommune(com) { return (gCommunes().filter(function (x) { return x[0] === com; })[0] || [com, com])[1]; }
  /* Après la création d'une commune (onglet Créer) : adresse d'alerte par défaut,
     fiche client au statut « Client » remplie avec les infos de la mairie, et le
     maire en premier contact. Les champs déjà remplis de la fiche ne sont pas touchés. */
  PAV.emailAdmin = function () {
    return (G_CHARGE ? Promise.resolve() : api("gestion", { op: "lire" }).then(function (j) { G = j.donnees || {}; G_CHARGE = true; }))
      .then(function () { return emet("email") || gCompte(); }).catch(function () { return "pav.collecte@gmail.com"; });
  };
  PAV.apresCreation = function (com, p) {
    var t = function (v) { v = String(v || "").trim(); return /^À REMPLIR/i.test(v) ? "" : v; };
    return api("gestion", { op: "lire" }).then(function (j) {
      G = j.donnees || {}; G_CHARGE = true;
      var ex = (G.Clients || []).filter(function (c) { return c.commune === com; })[0] || {};
      var v = Object.assign({}, ex, { commune: com, statut: "client" }); delete v.row_number;
      [["nom_officiel", p["commune.nom"]], ["code_insee", p["commune.codeInsee"]], ["code_postal", p["commune.codePostal"]], ["ville", p["commune.nom"]],
       ["maire", p["commune.maire"]], ["telephone_mairie", p["commune.telephone"]], ["email_mairie", p["commune.email"]], ["site_mairie", p["commune.siteMairie"]]]
        .forEach(function (k) { if (!t(v[k[0]]) && t(k[1])) v[k[0]] = t(k[1]); });
      var maire = t(v.maire);
      return api("gestion", { op: "enregistrer", onglet: "Clients", valeurs: v }).then(function () {
        var deja = !maire || (G.Contacts || []).some(function (k) { return k.commune === com && String(k.nom || "").toLowerCase() === maire.toLowerCase(); });
        if (deja) return { maire: maire, contact: false };
        return api("gestion", { op: "enregistrer", onglet: "Contacts", valeurs: { commune: com, nom: maire, fonction: "maire", email: v.email_mairie || "", telephone: v.telephone_mairie || "", facturation: "non", notes: "Premier contact, créé avec la commune" } })
          .then(function () { return { maire: maire, contact: true }; });
      });
    }).then(function (r) { try { chargerGestion(true); } catch (e) {} return r; });
  };
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
    return api("gestion", donnees).then(function (j) {
      msg(idMsg, ok, "ok");
      if (/^(Echanges|Rendezvous)$/.test(donnees.onglet || "") || /document/.test(donnees.op || "")) syncAgendaPlusTard();
      return chargerGestion(true).then(function () { return j; });
    })
      .catch(function (e) { msg(idMsg, e.message, "ko"); throw e; });
  }

  function dessinerGestion() {
    // Liste des communes (sélecteur de la fiche), en gardant le choix courant.
    var s = $("g-commune"), avant = s.value;
    s.innerHTML = gCommunes().map(function (c) { return '<option value="' + gEsc(c[0]) + '">' + gEsc(c[1]) + '</option>'; }).join("");
    if (avant && gCommunes().some(function (c) { return c[0] === avant; })) s.value = avant;
    dessinerPipeline(); dessinerFiche(); dessinerEmetteur(); dessinerDocs(); dessinerAgenda(); dessinerTarifs(); dessinerAvis();
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
  function dessinerPotentiel(com) {
    var pt = gPotentiel(com), el = $("g-potentiel");
    if (!el) { el = document.createElement("div"); el.id = "g-potentiel"; $("g-contrat").insertAdjacentElement("afterend", el); }
    el.innerHTML = '<div style="margin-top:8px;padding:8px 12px;background:#EEF5F0;border:1px solid var(--trait);border-radius:9px;font-size:15px">Potentiel : <b>' + (pt.points || "?") + ' point(s)</b>' + (pt.estime ? ' <span class="petit">(estimé : ' + gEsc(pt.base) + ')</span>' : ' <span class="petit">(' + gEsc(pt.base) + ')</span>')
      + (pt.montant && pt.points ? ' · <b>' + gEuros(pt.montant) + ' HT/an</b> <span class="petit">(' + gEsc(pt.source) + ')</span>' : ' · <span class="petit">montant : renseignez le prix de l\'abonnement dans l\'onglet Tarifs</span>') + '</div>';
  }
  var G_AUTO_FAIT = {};
  function dessinerFiche() {
    var com = $("g-commune").value; if (!com) { $("g-fiche").innerHTML = ""; return; }
    var c = gClient(com), ct = (G.communes || []).filter(function (x) { return x.commune === com; })[0] || {};
    $("g-contrat").innerHTML = "Contrat (onglet Communes) : tarif par point <b>" + (ct.tarif_point ? gEuros(ct.tarif_point) : "non renseigné") + "</b> · anniversaire <b>" + (gDateFR(ct.anniversaire) || "non renseigné") + "</b> · initialisation " + (ct.cloture_initialisation ? "clôturée le <b>" + gDateFR(ct.cloture_initialisation) + "</b>" : "<b>en cours</b>") + (ct.etat ? " · état : " + gEsc(ct.etat) : "");
    dessinerPotentiel(com);
    $("g-fiche").innerHTML = '<div class="gf-pane" data-p="fiche">' + gChamp("gf-statut", "Statut de la relation", c.statut || "prospect", null, G_STATUTS)
      + gChamp("gf-nom", "Nom officiel (facturation)", c.nom_officiel, "text", null, "ex. Mairie d'Andancette")
      + gChamp("gf-siret", "SIRET de la mairie", c.siret)
      + gChamp("gf-chorus", "Code service Chorus Pro", c.code_service_chorus, "text", null, "si la mairie en impose un")
      + gChamp("gf-adresse", "Adresse de facturation", c.adresse_facturation)
      + '<div style="display:grid;grid-template-columns:120px 1fr;gap:8px">' + '<div>' + gChamp("gf-cp", "Code postal", c.code_postal) + '</div><div>' + gChamp("gf-ville", "Ville", c.ville) + '</div></div>'
      + gChamp("gf-email", "E-mail de facturation", c.email_facturation, "email")
      + gChamp("gf-date", "Date du contrat", c.date_contrat, "date")
      + gChamp("gf-notes", "Notes", c.notes, "zone") + '</div>'
      + '<div class="gf-pane" data-p="offre">' + htmlConditions(c) + '</div>'
      + '<div class="gf-pane" data-p="infos">' + ((G.communes || []).some(function (x) { return x.commune === com; }) ? htmlDeployee(com) : '<button class="second" type="button" id="gf-deployer" style="margin-top:12px;width:100%">Lancer le déploiement de la commune</button><p class="petit">Ouvre l\'onglet « Créer » pré-rempli avec cette commune (recherche INSEE et mairie lancée) : vous complétez puis validez.</p>')
      + '<div style="margin-top:12px;padding:10px 12px;background:#FAF8F3;border:1px solid var(--trait);border-radius:9px"><b>Infos publiques</b>'
      + ' <button class="second" type="button" id="gf-auto" style="float:right;padding:4px 10px;font-size:13px">Rechercher automatiquement</button>'
      + '<div id="gf-infos" class="petit" style="margin-top:6px;clear:both"></div></div>'
      + '<div id="gf-bareme" style="margin-top:12px;padding:10px 12px;background:#FAF8F3;border:1px solid var(--trait);border-radius:9px"><b>Bac-Score</b> <span class="petit">— chargement…</span></div></div>';
    gfAppliquerPane(); dessinerBaremeFiche(com);
    dessinerInfos(c); dessinerConditions(); dessinerDocsFiche();
    dessinerContacts(); dessinerEchanges();
    // Fiche sans infos publiques : recherche lancée d'elle-même (une fois par commune et par session).
    if (!c.infos_maj && !(G_AUTO && G_AUTO.infos_maj) && !G_AUTO_FAIT[com]) { G_AUTO_FAIT[com] = 1; rechercherInfos(true); }
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
  function rechercherInfos(auto) {
    var com = $("g-commune").value; if (!com) return;
    var nom = (gCommunes().filter(function (c) { return c[0] === com; })[0] || [com, com])[1];
    var c = gClient(com), cp = gVal("gf-cp");
    msg("msg-fiche", "Recherche des infos publiques de " + nom + "…");
    gJson("https://geo.api.gouv.fr/communes?nom=" + encodeURIComponent(nom) + "&fields=nom,code,codesPostaux,codeDepartement,population,epci&boost=population&limit=8").catch(function () {
      // geo.api.gouv.fr injoignable (certains réseaux mobiles) : liste des communes hébergée avec la console.
      return listeCommunes().then(function (t) { return t.filter(function (x) { return slugCommune(x.nom) === slugCommune(nom); }).slice(0, 8); });
    }).then(function (l) {
      l = l.filter(function (x) { return x.nom.toLowerCase() === String(nom).toLowerCase(); }).concat(l.filter(function (x) { return x.nom.toLowerCase() !== String(nom).toLowerCase(); }));
      var g = c.code_insee ? l.filter(function (x) { return x.code === c.code_insee; })[0] : null;
      if (!g && cp) g = l.filter(function (x) { return (x.codesPostaux || []).indexOf(cp) >= 0; })[0];
      if (!g && l.length > 1 && l[1].nom.toLowerCase() === l[0].nom.toLowerCase()) {
        if (auto) throw new Error("Plusieurs communes portent ce nom : cliquez « Rechercher automatiquement » pour choisir la bonne.");
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
      if ($("g-commune").value !== com) return;
      G_AUTO = a; dessinerInfos(gClient(com)); dessinerPotentiel(com);
      msg("msg-fiche", "Infos publiques trouvées" + (faits.length ? " ; complété : " + faits.join(", ") : "") + ". Vérifiez puis « Enregistrer la fiche ».", "ok");
    }).catch(function (e) { msg("msg-fiche", e.message, "ko"); });
  }
  var G_CONTACT = null, G_ECHANGE = null, GA_RETOUR = false;
  function retourAgenda() {
    if (!GA_RETOUR) return; GA_RETOUR = false;
    var na = document.querySelector('nav button[data-onglet="agenda"]'); if (na) na.click();
  }
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
  var G_REGLAGES = [["habitants_par_point", "300", "Réglage : habitants par point de collecte, pour estimer les points d'une commune non relevée"],
    ["carte_centre", "Albon", "Réglage : commune au centre de la carte des prospects"],
    ["carte_rayon_km", "20", "Réglage : rayon par défaut de la carte (km)"],
    ["rappel_echeance_jours", "30", "Réglage : rappel avant une échéance (facture, devis, anniversaire de contrat), en jours ; 0 = pas de rappel"], ["drive_compte", "pav.collecte@gmail.com", "Compte Google des PDF archivés sur Drive et de Gmail (les liens ☁️ Drive s'ouvrent avec ce compte)"]];
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
    $("g-doc-lignes").innerHTML = (G_DOC.lignes.length ? '<div class="gd-ent"><span>Point</span><span>Qté</span><span>Prix unit. HT</span><span style="text-align:right">Total HT</span><span></span></div>' : '') + G_DOC.lignes.map(function (l, i) {
      return '<div class="g-ligne" data-i="' + i + '" style="padding:8px 0;border-bottom:1px solid var(--trait)">'
        + '<input data-k="designation" placeholder="Désignation (ex. Point de collecte AND-06 — 2027)" value="' + gEsc(l.designation) + '"' + (v ? " disabled" : "") + '>'
        + '<div class="gd-cols">'
        + '<input data-k="site_code" placeholder="—" value="' + gEsc(l.site_code) + '"' + (v ? " disabled" : "") + ' aria-label="Point concerné">'
        + '<input data-k="quantite" type="number" step="any" placeholder="1" value="' + gEsc(l.quantite) + '"' + (v ? " disabled" : "") + ' aria-label="Quantité">'
        + '<input data-k="prix_unitaire_ht" type="number" step="0.01" placeholder="0,00" value="' + gEsc(l.prix_unitaire_ht) + '"' + (v ? " disabled" : "") + ' aria-label="Prix unitaire HT">'
        + '<b class="gd-tl">' + gEuros((Number(String(l.quantite).replace(",", ".")) || 0) * (Number(String(l.prix_unitaire_ht).replace(",", ".")) || 0)) + '</b>'
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
    Object.assign(v, lireConditions());
    if (G_AUTO) G_INFOS.forEach(function (k) { if (G_AUTO[k] !== undefined) v[k] = String(G_AUTO[k]); });
    G_AUTO = null;
    // Le maire trouvé (Répertoire national des élus) est ajouté aux contacts s'il n'y est pas encore.
    var x = Object.assign({}, gClient(com), v), maire = String(x.maire || "").trim();
    var dejaLa = !maire || (G.Contacts || []).some(function (k) { return k.commune === com && String(k.nom || "").toLowerCase() === maire.toLowerCase(); });
    gEnvoyer({ op: "enregistrer", onglet: "Clients", valeurs: v }, "msg-fiche", "Fiche enregistrée.").then(function () {
      if (dejaLa) return;
      return gEnvoyer({ op: "enregistrer", onglet: "Contacts", valeurs: { commune: com, nom: maire, fonction: "maire", email: x.email_mairie || "", telephone: x.telephone_mairie || "", facturation: "non", notes: "Ajouté depuis le Répertoire national des élus" + (x.maire_depuis ? " (maire depuis le " + gDateFR(x.maire_depuis) + ")" : "") } }, "msg-contact", "Maire ajouté aux contacts.")
        .then(function () { msg("msg-fiche", "Fiche enregistrée, et " + maire + " ajouté(e) aux contacts comme maire.", "ok"); });
    }).catch(function () {});
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
    if (b.id === "ge-annuler") { formEchange(null); retourAgenda(); return; }
    if (b.id === "ge-suppr") { if (!confirm("Supprimer cet échange ?")) return; gEnvoyer({ op: "supprimer", onglet: "Echanges", cle: G_ECHANGE.id }, "msg-echange", "Échange supprimé.").then(function () { G_ECHANGE = null; dessinerEchanges(); }).catch(function () {}); return; }
    if (b.id === "ge-ok") {
      var v = { id: G_ECHANGE ? G_ECHANGE.id : "", commune: $("g-commune").value, date: gVal("ge-date"), type: gVal("ge-type"), contact: gVal("ge-contact"), resume: gVal("ge-resume"), prochaine_action: gVal("ge-action"), echeance: gVal("ge-echeance"), fait: gVal("ge-fait") };
      if (!v.resume) { msg("msg-echange", "Résumez l'échange en une phrase.", "ko"); return; }
      gEnvoyer({ op: "enregistrer", onglet: "Echanges", valeurs: v }, "msg-echange", "Échange enregistré.").then(function () { G_ECHANGE = null; dessinerEchanges(); retourAgenda(); }).catch(function () {});
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
    var c = Object.assign({}, gClient(com), (G_AUTO && $("g-commune").value === com) ? G_AUTO : {}), ct = (G.communes || []).filter(function (x) { return x.commune === com; })[0] || {};
    var connus = (Number(c.nb_points) || 0) + (Number(c.nb_points_a_verifier) || 0);
    var hpp = Number(String(gReglage("habitants_par_point")).replace(",", ".")) || 300;
    var fin = function (r) { var ab = gAbonnement(r.points, c, ct); r.montant = ab.an; r.source = ab.source; r.tarif = r.points ? ab.an / r.points : 0; return r; };
    if (connus) return fin({ points: connus, estime: false, base: "points du Referentiel" });
    var pop = Number(c.population) || 0;
    if (pop) return fin({ points: Math.max(1, Math.ceil(pop / hpp)), estime: true, base: pop.toLocaleString("fr-FR") + " hab. ÷ " + hpp });
    return fin({ points: 0, estime: true, base: "population inconnue : « Rechercher automatiquement »" });
  }

  /* ——— Sections Carte et Agenda ——— */
  var G_COULEURS = { aucun: "#9AA39B", prospect: "#2F6EA8", demo: "#7B4FA3", devis: "#E08A00", client: "#2E7D4F", suspendu: "#B3261E", perdu: "#5E6B63" };
  main.insertAdjacentHTML("beforeend",
    '<section id="carte"><div class="carte">'
    + '<h2>Communes autour de moi</h2>'
    + '<div style="display:grid;grid-template-columns:1fr 110px;gap:8px">'
    + '<div><label for="gk-centre"><b>Centre</b></label><input id="gk-centre" placeholder="Albon"></div>'
    + '<div><label for="gk-rayon"><b>Rayon</b></label><select id="gk-rayon">' + [5, 10, 15, 20, 30, 40, 50, 75].map(function (k) { return '<option value="' + k + '">' + k + ' km</option>'; }).join("") + '</select></div></div>'
    + '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="second" type="button" id="gk-moi">Ma position</button><button class="second" type="button" id="gk-viser">Choisir le centre sur la carte</button><button class="principal" type="button" id="gk-ok" style="margin-top:0;flex:1">Afficher</button></div>'
    + '<details id="gk-filtres" style="margin-top:10px"><summary class="petit" style="cursor:pointer"><b>Filtres</b></summary>'
    + '<div class="petit" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px">Points de collecte : de <input id="gk-min" type="number" min="0" placeholder="0" style="width:70px"> à <input id="gk-max" type="number" min="0" placeholder="∞" style="width:70px"></div>'
    + '<div class="petit" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px">' + [["libre", "Pas en relation"], ["cours", "En cours"], ["client", "Clients"], ["perdu", "Perdus / suspendus"]].map(function (g) { return '<label style="margin:0;display:flex;gap:4px;align-items:center"><input type="checkbox" data-gkg="' + g[0] + '" checked style="width:auto">' + g[1] + '</label>'; }).join("") + '</div></details>'
    + '<div style="position:relative"><div id="gk-carte" style="height:min(38vh,380px);min-height:230px;margin-top:12px;border-radius:10px;border:1px solid var(--trait)"></div>'
    + '<button type="button" id="gk-bouger" class="second" hidden style="position:absolute;right:8px;bottom:8px;z-index:500;padding:5px 10px;font-size:12px">Déplacer la carte</button></div>'
    + '<div id="gk-legende" class="petit" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:10px"></div>'
    + '<div id="gk-potentiel" class="petit" style="margin-top:12px"></div>'
    + '<div class="msg" id="msg-carte"></div>'
    + '<p class="petit" style="margin-top:8px">Un clic sur une commune affiche ses habitants et son potentiel ; « Ouvrir la fiche » la crée comme prospect si elle n\'est pas encore suivie (elle n\'est enregistrée qu\'avec « Enregistrer la fiche »).</p>'
    + '</div></section>'
    + '<section id="agenda"><div class="carte">'
    + '<h2>Agenda des actions</h2>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><button class="principal" id="ga-sync" type="button" style="margin-top:0;flex:2">Synchroniser avec Google Agenda</button><button class="second" id="ga-ics" type="button" style="flex:1">Exporter (.ics)</button></div>'
    + '<p class="petit" style="margin-top:0">Les échéances vont dans l\'agenda Google « PAV — actions » (créé au premier envoi) ; elles se mettent aussi à jour toutes seules après chaque enregistrement d\'échange, de devis ou de facture. Une action faite disparaît de l\'agenda.</p>'
    + '<div class="petit" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px">Rappel avant chaque échéance (facture, devis, anniversaire de contrat) : <input id="ga-rappel" type="number" min="0" max="365" style="width:70px;margin:0"> jours <button class="second" id="ga-rappel-ok" type="button" style="padding:5px 10px;font-size:13px">Enregistrer</button></div>'
    + '<p class="petit" id="ga-info" hidden style="color:var(--accent)"></p>'
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
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "leaflet.css?v=1"; document.head.appendChild(l);
      var essai = function (src, suite) {
        var s = document.createElement("script"); s.src = src; s.onload = ok;
        s.onerror = function () { s.remove(); if (suite) essai(suite); else { GK.chargeL = null; ko(new Error("Bibliothèque de carte indisponible : réessayez.")); } };
        document.head.appendChild(s);
      };
      essai("leaflet.js?v=1", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
    });
    return GK.chargeL;
  }
  // Liste des communes hébergée avec la console (communes.json, d'après geo.api.gouv.fr) :
  // aucun appel externe, la carte marche aussi sur les réseaux mobiles qui bloquent geo.api.gouv.fr.
  var GK_LISTE = null;
  function listeCommunes() {
    if (GK_LISTE) return GK_LISTE;
    msg("msg-carte", "Chargement des communes…");
    GK_LISTE = fetch("communes.json?v=1").then(function (r) { if (!r.ok) throw new Error("communes.json : " + r.status); return r.json(); }).then(function (j) {
      GK.communes = j.c.map(function (x) { return { code: x[0], nom: x[1], centre: { coordinates: [x[3], x[2]] }, population: x[4], codeDepartement: x[5], codesPostaux: x[6] ? [x[6]] : [] }; });
      cacher("msg-carte"); return GK.communes;
    }).catch(function (e) { GK_LISTE = null; throw new Error("Liste des communes indisponible (" + e.message + ") : vérifiez la connexion puis réessayez."); });
    return GK_LISTE;
  }
  // Homonymes (Saint-Vallier 26 / 71…) : « Nom (26) » choisit le département ; sinon la plus proche des communes suivies.
  function choisirCommune(l, nom) {
    var m = String(nom || "").match(/^(.*?)\s*\((\w{2,3})\)\s*$/), dep = m ? m[2] : "", s = slugCommune(m ? m[1] : nom);
    var cand = l.filter(function (c) { return (slugCommune(c.nom) === s || c.code === nom) && (!dep || c.codeDepartement === dep); });
    if (cand.length < 2) return cand[0];
    var refs = (G && G.Clients || []).map(function (k) { return l.filter(function (x) { return x.code === k.code_insee; })[0]; }).filter(Boolean);
    if (!refs.length) refs = l.filter(function (x) { return slugCommune(x.nom) === slugCommune(gReglage("carte_centre") || "Albon"); }).slice(0, 1);
    if (!refs.length) return cand.sort(function (a, b) { return (b.population || 0) - (a.population || 0); })[0];
    var lat = refs.reduce(function (t, x) { return t + x.centre.coordinates[1]; }, 0) / refs.length, lon = refs.reduce(function (t, x) { return t + x.centre.coordinates[0]; }, 0) / refs.length;
    return cand.sort(function (a, b) { return distKm([lat, lon], [a.centre.coordinates[1], a.centre.coordinates[0]]) - distKm([lat, lon], [b.centre.coordinates[1], b.centre.coordinates[0]]); })[0];
  }
  function centreDepuisNom(nom) {
    return listeCommunes().then(function (l) {
      var c0 = choisirCommune(l, nom);
      if (!c0) throw new Error("Commune de centre introuvable : « " + nom + " ».");
      return [c0.centre.coordinates[1], c0.centre.coordinates[0]];
    });
  }
  function communesAutour() { return listeCommunes(); }
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
    var rayon = Number($("gk-rayon").value) || 20, centre = centreForce || GK_CENTRE;
    var pCentre = centre ? Promise.resolve(centre) : centreDepuisNom($("gk-centre").value.trim() || "Albon");
    Promise.all([chargerLeaflet(), pCentre]).then(function (r) { centre = r[1]; return communesAutour(centre, rayon); }).then(function () {
      GK_CENTRE = centre;
      if (!GK.carte) {
        // Sur écran tactile, la carte ne capture pas le défilement de la page : déplacement activé à la demande.
        var tactile = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
        GK.carte = L.map("gk-carte", { scrollWheelZoom: false, dragging: !tactile, tap: !tactile });
        if (tactile) { $("gk-bouger").hidden = false; }
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(GK.carte);
        // « Choisir le centre » : le prochain clic sur la carte devient le centre du cercle.
        GK.carte.on("click", function (e) {
          if (!GK.viser) return;
          finViser();
          GK_CENTRE = [e.latlng.lat, e.latlng.lng]; $("gk-centre").value = "Point choisi sur la carte"; ouvrirCarteProspects(GK_CENTRE);
        });
      }
      if (GK.couche) GK.couche.remove();
      GK.couche = L.layerGroup().addTo(GK.carte);
      L.circle(centre, { radius: rayon * 1000, color: "#1F3A2E", weight: 1, fill: false, dashArray: "4 4", interactive: false }).addTo(GK.couche);
      L.circleMarker(centre, { radius: 4, color: "#1F3A2E", fillColor: "#1F3A2E", fillOpacity: 1, interactive: false }).addTo(GK.couche);
      var f = filtresCarte(), hpp = Number(gReglage("habitants_par_point")) || 300;
      var tous = GK.communes.map(function (c) { return { c: c, d: distKm(centre, [c.centre.coordinates[1], c.centre.coordinates[0]]) }; })
        .filter(function (x) { return x.d <= rayon; }).map(function (x) { return infosCommune(x, hpp); });
      var proches = tous.filter(function (x) { return x.pts >= f.min && x.pts <= f.max && f.groupes[groupeStatut(x.s.statut)]; });
      proches.forEach(function (x) {
        var c = x.c, s = x.s, pos = [c.centre.coordinates[1], c.centre.coordinates[0]];
        var r = Math.max(5, Math.min(16, 3 + Math.sqrt(c.population || 0) / 9));
        var m = L.circleMarker(pos, { radius: r, color: s.statut === "aucun" ? "#7d857e" : "#fff", weight: s.statut === "aucun" ? 1 : 2, fillColor: G_COULEURS[s.statut] || G_COULEURS.aucun, fillOpacity: s.statut === "aucun" ? 0.45 : 0.95 }).addTo(GK.couche);
        m.on("mouseover", function () { if (!GK.viser) this.openPopup(); });
        m.bindPopup('<b>' + gEsc(c.nom) + '</b> (' + gEsc(c.codeDepartement) + ')<br>' + (c.population || 0).toLocaleString("fr-FR") + ' habitants · ' + x.d.toFixed(1) + ' km'
          + '<br>Statut : <b>' + gEsc(s.statut === "aucun" ? "pas en relation" : gLib(G_STATUTS, s.statut)) + '</b>'
          + '<br>Potentiel : ' + x.pts + ' point(s)' + (x.estime ? ' (estimé)' : '') + (x.eur ? ' ≈ ' + gEuros(x.eur) + ' HT/an' : '')
          + '<br><button type="button" class="second" data-gk-ouvrir="' + gEsc(c.code) + '" style="margin-top:6px;padding:4px 10px;font-size:13px">Ouvrir la fiche</button>');
      });
      if (!centreForce || !GK.dejaVu) GK.carte.setView(centre, rayon <= 10 ? 12 : rayon <= 20 ? 11 : rayon <= 40 ? 10 : 9);
      GK.dejaVu = true;
      setTimeout(function () { GK.carte.invalidateSize(); }, 50);
      msg("msg-carte", proches.length + " commune(s) affichée(s) sur " + tous.length + " dans un rayon de " + rayon + " km" + (proches.length < tous.length ? " (filtres actifs)" : "") + ", dont " + proches.filter(function (x) { return x.s.statut !== "aucun"; }).length + " suivie(s).", "info");
      potentielCercle(proches, rayon, proches.length < tous.length);
    }).catch(function (e) { msg("msg-carte", e.message, "ko"); });
  }
  function groupeStatut(st) { return st === "client" ? "client" : /^(prospect|demo|devis)$/.test(st) ? "cours" : st === "aucun" ? "libre" : "perdu"; }
  function filtresCarte() {
    var mi = gNum($("gk-min").value), ma = gNum($("gk-max").value), g = {};
    Array.prototype.forEach.call(document.querySelectorAll("#gk-filtres input[data-gkg]"), function (i) { g[i.dataset.gkg] = i.checked; });
    return { min: mi || 0, max: ma || Infinity, groupes: g };
  }
  // Points (connus ou estimés) et abonnement HT/an d'une commune de la carte.
  function infosCommune(x, hpp) {
    var c = x.c, s = suivie(c), cl = s.client || (s.connue ? { commune: s.id } : null);
    var ct = cl ? (G.communes || []).filter(function (k) { return k.commune === s.id; })[0] || {} : null;
    var known = cl ? (Number(cl.nb_points) || 0) + (Number(cl.nb_points_a_verifier) || 0) : 0;
    var pts = known || Math.max(1, Math.ceil(((cl && Number(cl.population)) || c.population || 0) / hpp));
    // Calcul choisi au-dessus du potentiel du cercle (sauf prix négocié d'une fiche, qui reste prioritaire).
    var clc = (GK_CALC && (cl || {}).calcul_abonnement !== "negocie") ? Object.assign({}, cl, { calcul_abonnement: GK_CALC }) : cl;
    return { c: c, s: s, d: x.d, pts: pts, estime: !known, eur: gAbonnement(pts, clc, ct).an };
  }
  // « Ouvrir la fiche » : commune suivie → sa fiche ; sinon prospect préparé (non enregistré).
  /* ——— Potentiel du cercle : abonnement HT/an (calculé après l'affichage de la carte, sans la bloquer) ——— */
  var GK_CALCUL = 0;
  var GK_CALC = "";
  function potentielCercle(proches, rayon, filtre) {
    var num = ++GK_CALCUL, box = $("gk-potentiel");
    box.innerHTML = '<i>Calcul du potentiel du cercle…</i>';
    setTimeout(function () {
      if (num !== GK_CALCUL) return;
      var hpp = Number(gReglage("habitants_par_point")) || 300, chiffre = gAbonnement(1, null, null).brut > 0;
      var G4 = { client: [0, 0, 0], cours: [0, 0, 0], libre: [0, 0, 0], perdu: [0, 0, 0] }, top = [];
      proches.forEach(function (x) {
        var g = G4[groupeStatut(x.s.statut)]; g[0]++; g[1] += x.pts; g[2] += x.eur;
        if (x.s.statut === "aucun" || /^(prospect|demo|devis)$/.test(x.s.statut)) top.push(x);
      });
      var ligne = function (lib, g, coul) { return '<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + coul + ';margin-right:5px"></span>' + lib + '</td><td style="text-align:right">' + g[0] + '</td><td style="text-align:right">' + g[1] + '</td><td style="text-align:right;font-size:18px"><b>' + (chiffre || g[2] ? gEuros(g[2]) : '—') + '</b></td></tr>'; };
      var tot = [G4.client[0] + G4.cours[0] + G4.libre[0], G4.client[1] + G4.cours[1] + G4.libre[1], G4.client[2] + G4.cours[2] + G4.libre[2]];
      top.sort(function (a, b) { return b.eur - a.eur || b.pts - a.pts; });
      box.innerHTML = '<div style="padding:10px 12px;background:#EEF5F0;border:1px solid var(--trait);border-radius:9px">'
        + '<b style="font-size:15px">Potentiel du cercle de ' + rayon + ' km' + (filtre ? ' (communes filtrées)' : '') + ' — abonnement HT/an</b>'
        + '<div class="gav-seg" id="gk-calcul" role="group" aria-label="Calcul du chiffre d\'affaires" style="display:flex;margin:8px 0 2px;width:100%">'
        + [["", "Tarif de base"], ["point", "Par point"], ["tranches", "Par tranches"]].map(function (o) { return '<button type="button" data-gkc="' + o[0] + '" style="flex:1;padding:9px 6px;font-size:15px"' + (o[0] === GK_CALC ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join("") + '</div>'
        + '<table class="dns" style="margin-top:6px"><tr><th style="text-align:left"></th><th style="text-align:right">Communes</th><th style="text-align:right">Points</th><th style="text-align:right">€ HT/an</th></tr>'
        + ligne("Clients (acquis)", G4.client, G_COULEURS.client) + ligne("En cours (prospect, démo, devis)", G4.cours, G_COULEURS.devis) + ligne("Pas encore en relation", G4.libre, G_COULEURS.aucun)
        + '<tr><td><b>Total</b></td><td style="text-align:right"><b>' + tot[0] + '</b></td><td style="text-align:right"><b>' + tot[1] + '</b></td><td style="text-align:right;font-size:22px;color:var(--vert)"><b>' + (chiffre || tot[2] ? gEuros(tot[2]) : '—') + '</b></td></tr></table>'
        + (G4.perdu[0] ? '<div>Hors total : ' + G4.perdu[0] + ' commune(s) perdue(s) ou suspendue(s), ' + gEuros(G4.perdu[2]) + '/an.</div>' : '')
        + (chiffre ? '' : '<div style="color:var(--ko);margin-top:4px">Prix de l\'abonnement non renseigné : complétez l\'onglet Tarifs pour chiffrer.</div>')
        + '<div style="margin-top:4px;color:var(--doux)">Points connus quand la commune est relevée, sinon estimés à 1 pour ' + hpp + ' habitants ; tarif ' + ((GK_CALC || (gReglage("calcul_abonnement") === "tranches" ? "tranches" : "point")) === "tranches" ? "par tranches" : "par point") + (GK_CALC ? "" : " (réglage de l\'onglet Tarifs)") + ' ; remises des fiches appliquées ; options non comprises.</div>'
        + (top.length ? '<div style="margin-top:8px"><b>Plus gros potentiels à travailler</b>' + top.slice(0, 8).map(function (x) {
            return '<div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--trait)"><span style="width:9px;height:9px;border-radius:50%;background:' + (G_COULEURS[x.s.statut] || G_COULEURS.aucun) + '"></span><span style="flex:1">' + gEsc(x.c.nom) + ' <span style="color:var(--doux)">' + x.d.toFixed(0) + ' km · ' + (x.c.population || 0).toLocaleString("fr-FR") + ' hab.</span></span><span>' + x.pts + ' pts' + (x.eur ? ' · ' + gEuros(x.eur) : '') + '</span><a href="#" data-gk-ouvrir="' + gEsc(x.c.code) + '">Fiche</a></div>';
          }).join("") + '</div>' : '')
        + '</div>';
    }, 0);
  }
  $("gk-potentiel").addEventListener("click", function (e) {
    var c = e.target.closest("[data-gkc]");
    if (c) { GK_CALC = c.dataset.gkc; ouvrirCarteProspects(); return; }
    var a = e.target.closest("[data-gk-ouvrir]"); if (!a) return; e.preventDefault();
    var b = document.createElement("button"); b.dataset.gkOuvrir = a.dataset.gkOuvrir; b.hidden = true; $("gk-carte").appendChild(b); b.click(); b.remove();
  });
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
  $("gk-bouger").addEventListener("click", function () {
    if (!GK.carte) return;
    var actif = GK.carte.dragging.enabled();
    if (actif) GK.carte.dragging.disable(); else GK.carte.dragging.enable();
    this.textContent = actif ? "Déplacer la carte" : "Fixer la carte";
  });
  $("gk-ok").addEventListener("click", function () { if (!/^Point choisi|^Ma position/.test($("gk-centre").value)) GK_CENTRE = null; ouvrirCarteProspects(); });
  // Mode « choisir le centre » : la carte se déplace et se zoome librement, puis un toucher fixe le centre.
  function finViser() {
    GK.viser = false; $("gk-viser").textContent = "Choisir le centre sur la carte"; $("gk-carte").style.cursor = "";
    if (GK.carte && GK.bougeait === false) GK.carte.dragging.disable();
    $("gk-bouger").textContent = GK.carte && GK.carte.dragging.enabled() ? "Fixer la carte" : "Déplacer la carte";
  }
  $("gk-viser").addEventListener("click", function () {
    if (!GK.carte) { msg("msg-carte", "Affichez d'abord la carte.", "info"); return; }
    if (GK.viser) { finViser(); msg("msg-carte", "Choix du centre annulé.", "info"); return; }
    GK.viser = true; GK.bougeait = GK.carte.dragging.enabled();
    GK.carte.dragging.enable(); GK.carte.closePopup();
    this.textContent = "Annuler le choix du centre"; $("gk-carte").style.cursor = "crosshair";
    msg("msg-carte", "Faites glisser et zoomez la carte jusqu'à l'endroit voulu, puis touchez-le (sans glisser) : il devient le centre du cercle.", "info");
    $("gk-carte").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("gk-centre").addEventListener("input", function () { GK_CENTRE = null; });
  var GK_FILTRE = null;
  $("gk-filtres").addEventListener("input", function () { clearTimeout(GK_FILTRE); GK_FILTRE = setTimeout(function () { if (GK.carte) ouvrirCarteProspects(GK_CENTRE); }, 400); });
  $("gk-rayon").addEventListener("change", function () { ouvrirCarteProspects(); });
  $("gk-moi").addEventListener("click", function () {
    if (!navigator.geolocation) { msg("msg-carte", "Géolocalisation indisponible sur cet appareil.", "ko"); return; }
    msg("msg-carte", "Recherche de votre position…");
    navigator.geolocation.getCurrentPosition(function (p) { $("gk-centre").value = "Ma position"; GK_CENTRE = [p.coords.latitude, p.coords.longitude]; ouvrirCarteProspects(GK_CENTRE); },
      function () { msg("msg-carte", "Position refusée ou indisponible.", "ko"); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  /* ——— Agenda : actions prévues (échanges), devis à relancer, factures à échéance, anniversaires de contrat ——— */
  var GA_MOIS = new Date(); GA_MOIS.setDate(1);
  var GA_SEL = null;   // jour sélectionné dans le calendrier (cadre orange) : la liste et l'ajout portent sur lui
  function evenements() {
    var ev = [], noms = {}; gCommunes().forEach(function (c) { noms[c[0]] = c[1]; });
    var auj = new Date().toISOString().slice(0, 10);
    (G.Echanges || []).forEach(function (e) {
      if (e.echeance && e.fait !== "oui") ev.push({ date: e.echeance, type: "action", couleur: "#E08A00", titre: e.prochaine_action || e.resume, commune: e.commune, retard: e.echeance < auj, id: e.id, ech: e.id });
      if (e.date) ev.push({ date: e.date, type: "echange", couleur: "#2F6EA8", titre: gLib(G_TYPES_ECH, e.type) + (e.contact ? " avec " + e.contact : "") + " : " + e.resume, commune: e.commune, passe: true, ech: e.id });
      if (e.echeance && e.fait === "oui") ev.push({ date: e.echeance, type: "fait", couleur: "#2E7D4F", titre: "✓ " + (e.prochaine_action || e.resume), commune: e.commune, passe: true, ech: e.id });
    });
    (G.Devis || []).forEach(function (d) { if (d.validite && (d.statut === "envoye" || d.statut === "brouillon")) ev.push({ date: d.validite, type: "devis", couleur: "#7B4FA3", titre: "Fin de validité du devis " + d.numero + (d.statut === "envoye" ? " — relancer" : " (brouillon)"), commune: d.commune, retard: d.validite < auj && d.statut === "envoye", doc: ["devis", d.numero] }); });
    (G.Factures || []).forEach(function (f) { if (f.echeance && (f.statut === "emise" || f.statut === "deposee_chorus")) ev.push({ date: f.echeance, type: "facture", couleur: "#B3261E", titre: "Échéance de la facture " + f.numero + " (" + gEuros(f.total_ttc) + ")", commune: f.commune, retard: f.echeance < auj, doc: ["facture", f.numero] }); });
    (G.communes || []).forEach(function (c) {
      if (!c.anniversaire) return;
      var a = String(c.anniversaire).slice(5, 10), an = new Date().getFullYear();
      [an, an + 1].forEach(function (y) { ev.push({ date: y + "-" + a, type: "anniversaire", couleur: "#2E7D4F", titre: "Anniversaire du contrat — forfait annuel à facturer", commune: c.commune }); });
    });
    // Rappel J-N avant les échéances (factures, fins de validité de devis, anniversaires de contrat).
    var nj = Math.max(0, Math.min(365, Number(gReglage("rappel_echeance_jours")) || 0));
    if (nj) ev.filter(function (x) { return /^(devis|facture|anniversaire)$/.test(x.type); }).forEach(function (x) {
      var d = new Date(x.date + "T12:00:00"); d.setDate(d.getDate() - nj);
      ev.push({ date: d.toISOString().slice(0, 10), type: "rappel", couleur: "#C9752B", titre: "Rappel J-" + nj + " : " + x.titre + " (le " + gDateFR(x.date) + ")", commune: x.commune, doc: x.doc });
    });
    // Événements saisis librement (onglet Rendezvous du classeur).
    (G.Rendezvous || []).forEach(function (r) {
      if (!r.date || r.statut === "annule") return;
      var fait = r.statut === "fait";
      ev.push({ date: r.date, heure: r.heure || "", type: "rdv", couleur: fait ? "#2E7D4F" : "#1F7A8C", titre: (fait ? "✓ " : "") + (r.titre || "Rendez-vous") + (r.contact ? " (" + r.contact + ")" : ""), commune: r.commune, rdv: r.id, note: r.note, passe: r.date < auj || fait, fait: fait });
    });
    ev.forEach(function (x) { x.nomCommune = noms[x.commune] || x.commune || ""; });
    return ev.sort(function (a, b) { return a.date.localeCompare(b.date) || String(a.heure || "99").localeCompare(String(b.heure || "99")); });
  }
  function ligneEv(x) {
    var cols = '<span class="ga-pt" style="background:' + x.couleur + '"></span><b class="ga-dt">' + gDateFR(x.date).slice(0, 5) + '</b><span class="ga-hr">' + gEsc(x.heure || "") + '</span>';
    if (x.rdv) return '<div class="ga-l" data-ga-rdv="' + gEsc(x.rdv) + '">' + cols
      + '<span class="ga-tx">' + gEsc(x.titre) + (x.nomCommune ? ' <i>· ' + gEsc(x.nomCommune) + '</i>' : '')
      + (x.note ? '<small>' + gEsc(String(x.note).slice(0, 220)) + '</small>' : '') + '</span>'
      + '<span class="ga-bt">' + (x.fait ? '' : '<button type="button" class="ga-del ga-ok" data-gr-fait="' + gEsc(x.rdv) + '" title="Marquer comme réalisé" aria-label="Marquer comme réalisé">✓</button>')
      + '<button type="button" class="ga-del" data-gr-suppr="' + gEsc(x.rdv) + '" title="Supprimer l\'événement" aria-label="Supprimer l\'événement">🗑</button></span></div>';
    return '<div class="ga-l" data-ga-com="' + gEsc(x.commune) + '"' + (x.ech ? ' data-ga-ech="' + gEsc(x.ech) + '"' : '') + (x.doc ? ' data-ga-doc="' + gEsc(x.doc[0]) + '" data-ga-num="' + gEsc(x.doc[1]) + '"' : '') + (x.retard ? ' style="color:var(--ko)"' : '') + '>' + cols
      + '<span class="ga-tx">' + gEsc(x.titre) + (x.nomCommune ? ' <i>· ' + gEsc(x.nomCommune) + '</i>' : '')
      + (x.passe ? '' : ' <a href="' + gEsc(lienGoogle(x)) + '" target="_blank" rel="noopener" data-gcal="1" style="white-space:nowrap;font-size:12px">+ Google Agenda</a>') + '</span>'
      + (x.type === "action" && x.id ? '<button type="button" class="ga-del ga-ok" data-ga-fait="' + gEsc(x.id) + '" title="Marquer l\'action comme réalisée" aria-label="Marquer l\'action comme réalisée">✓</button>'
        : /^(devis|facture|anniversaire|rappel)$/.test(x.type) ? '<span class="ga-auto" title="Échéance automatique : elle disparaît quand le devis ou la facture change de statut (onglet Factures), ou se règle dans le contrat de la commune.">🔒</span>' : '<span></span>')
      + '</div>';
  }
  /* Google Agenda : lien « ajouter » par événement (journée entière), et export .ics de toutes les échéances à venir. */
  function gJourSuivant(d) { var x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + 1); return x.toISOString().slice(0, 10); }
  function titreEv(x) { return "PAV " + x.nomCommune + " — " + x.titre; }
  function detailEv(x) { return "Commune : " + x.nomCommune + "\nConsole : " + location.origin + "/"; }
  function lienGoogle(x) {
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(titreEv(x))
      + "&dates=" + x.date.replace(/-/g, "") + "/" + gJourSuivant(x.date).replace(/-/g, "") + "&details=" + encodeURIComponent(detailEv(x));
  }
  function exporterIcs() {
    var auj = new Date(); auj.setDate(auj.getDate() - 30); var depuis = auj.toISOString().slice(0, 10);
    var ev = evenements().filter(function (x) { return !x.passe && x.date >= depuis; });
    if (!ev.length) { alerteAgenda("Aucune échéance à exporter."); return; }
    var esc = function (t) { return String(t).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1"); };
    var stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    var l = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PAV collecte//Console//FR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:PAV — actions"];
    ev.forEach(function (x) {
      l.push("BEGIN:VEVENT", "UID:" + (x.type + "-" + (x.id || (x.doc ? x.doc[1] : x.commune)) + "-" + x.date).replace(/[^A-Za-z0-9-]/g, "") + "@pav-console",
        "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + x.date.replace(/-/g, ""), "DTEND;VALUE=DATE:" + gJourSuivant(x.date).replace(/-/g, ""),
        "SUMMARY:" + esc(titreEv(x)), "DESCRIPTION:" + esc(detailEv(x)), "END:VEVENT");
    });
    l.push("END:VCALENDAR");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([l.join("\r\n")], { type: "text/calendar" })); a.download = "pav-actions.ics";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    alerteAgenda(ev.length + " échéance(s) exportée(s) dans pav-actions.ics : dans Google Agenda, Paramètres › Importer et exporter › Importer.");
  }
  function alerteAgenda(t) { var m = $("ga-info"); if (m) { m.textContent = t; m.hidden = false; } }
  /* Vues de l'agenda : mois (par défaut), semaine, jour. */
  var GA_VUE = "mois", GA_REF = null;
  function gaIso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function gaRef() { return GA_REF || (GA_SEL ? new Date(GA_SEL + "T12:00:00") : new Date()); }
  function dessinerAgenda() {
    if (typeof majRappelChamp === "function") majRappelChamp();
    if (!$("ga-grille")) return;
    if ($("ga-vues")) Array.prototype.forEach.call($("ga-vues").querySelectorAll("button"), function (b) { b.classList.toggle("on", b.dataset.gv === GA_VUE); });
    $("ga-grille").style.display = GA_VUE !== "mois" ? "none" : "grid";
    if (GA_VUE !== "mois") { dessinerVue(); return; }
    dessinerMois();
  }
  function dessinerVue() {
    var ev = evenements(), ref = gaRef(), jours = [];
    var retards = ev.filter(function (x) { return x.retard; });
    $("ga-retard").innerHTML = retards.length ? '<b style="color:var(--ko)">En retard (' + retards.length + ')</b><div class="petit">' + retards.map(ligneEv).join("") + '</div>' : "";
    if (GA_VUE === "jour") jours = [new Date(ref)];
    else { var lun = new Date(ref); lun.setDate(lun.getDate() - (lun.getDay() + 6) % 7); for (var i = 0; i < 7; i++) { var d = new Date(lun); d.setDate(lun.getDate() + i); jours.push(d); } }
    var f = function (d, o) { return d.toLocaleDateString("fr-FR", o); };
    $("ga-mois").textContent = GA_VUE === "jour" ? f(jours[0], { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : "Semaine du " + f(jours[0], { day: "numeric", month: jours[0].getMonth() === jours[6].getMonth() ? undefined : "short" }) + " au " + f(jours[6], { day: "numeric", month: "short", year: "numeric" });
    var auj = gaIso(new Date());
    $("ga-liste").innerHTML = jours.map(function (d) {
      var iso = gaIso(d), l = ev.filter(function (x) { return x.date === iso; });
      var t = f(d, { weekday: GA_VUE === "jour" ? "long" : "short", day: "numeric", month: "short" });
      var avec = l.filter(function (x) { return x.heure; }), sans = l.filter(function (x) { return !x.heure; });
      return '<div class="ga-vj' + (iso === auj ? ' ga-vj-auj' : '') + (iso === GA_SEL ? ' ga-vj-sel' : '') + '">'
        + '<div class="ga-vjt"><b data-gv-jour="' + iso + '">' + gEsc(t.charAt(0).toUpperCase() + t.slice(1)) + (iso === auj ? ' <span class="ga-tag">aujourd\'hui</span>' : '') + '</b>'
        + '<button type="button" class="second ga-vjp" data-gr-jour="' + iso + '" aria-label="Ajouter un événement ce jour">+ Ajouter</button></div>'
        + (l.length ? (GA_VUE === "jour" && sans.length && avec.length ? '<div class="petit ga-vjs">Toute la journée</div>' + sans.map(ligneEv).join("") + '<div class="petit ga-vjs">Dans la journée</div>' + avec.map(ligneEv).join("") : l.map(ligneEv).join(""))
          : '<p class="petit ga-vjv">—</p>')
        + '</div>';
    }).join("");
  }
  function dessinerMois() {
    var ev = evenements(), auj = new Date().toISOString().slice(0, 10);
    var an = GA_MOIS.getFullYear(), mo = GA_MOIS.getMonth();
    $("ga-mois").textContent = GA_MOIS.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    var premier = new Date(an, mo, 1), decal = (premier.getDay() + 6) % 7, nbj = new Date(an, mo + 1, 0).getDate();
    var h = ["L", "M", "M", "J", "V", "S", "D"].map(function (j) { return '<div class="petit" style="text-align:center;font-weight:700">' + j + '</div>'; }).join("");
    for (var i = 0; i < decal; i++) h += '<div></div>';
    for (var j = 1; j <= nbj; j++) {
      var d = an + "-" + String(mo + 1).padStart(2, "0") + "-" + String(j).padStart(2, "0");
      var duJour = ev.filter(function (x) { return x.date === d; });
      var estAuj = d === auj, estSel = d === GA_SEL;
      h += '<div data-ga-jour="' + d + '" class="ga-j' + (estAuj ? ' ga-auj' : '') + (estSel ? ' ga-sel' : '') + '"' + (estAuj ? ' title="Aujourd\'hui"' : '') + '>'
        + '<div class="ga-jn">' + j + '</div>'
        + '<div class="ga-pts">' + duJour.slice(0, duJour.length > 4 ? 3 : 4).map(function (x) { return '<span title="' + gEsc(x.titre) + '" style="background:' + x.couleur + '"></span>'; }).join("")
        + (duJour.length > 4 ? '<b>+' + (duJour.length - 3) + '</b>' : '') + '</div></div>';
    }
    $("ga-grille").innerHTML = h;
    var retards = ev.filter(function (x) { return x.retard; });
    $("ga-retard").innerHTML = retards.length ? '<b style="color:var(--ko)">En retard (' + retards.length + ')</b><div class="petit">' + retards.map(ligneEv).join("") + '</div>' : "";
    var debut = an + "-" + String(mo + 1).padStart(2, "0") + "-01", fin = an + "-" + String(mo + 1).padStart(2, "0") + "-31";
    if (GA_SEL && GA_SEL >= debut && GA_SEL <= fin) { listeJour(GA_SEL); return; }
    var duMois = ev.filter(function (x) { return x.date >= debut && x.date <= fin; });
    $("ga-liste").innerHTML = '<b>' + gEsc($("ga-mois").textContent) + ' — ' + duMois.length + ' élément(s)</b>' + (duMois.map(ligneEv).join("") || '<p>Rien ce mois-ci.</p>');
  }
  /* Liste d'un jour sélectionné : titre, bouton d'ajout bien visible, événements. */
  function listeJour(d) {
    var l = evenements().filter(function (x) { return x.date === d; });
    var dt = new Date(d + "T12:00:00"), titre = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    var court = dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    $("ga-liste").innerHTML = '<div class="ga-jt"><b>' + gEsc(titre.charAt(0).toUpperCase() + titre.slice(1)) + '</b><a href="#" id="ga-tout">Tout le mois</a></div>'
      + '<button type="button" class="principal ga-ajout" data-gr-jour="' + d + '">+ Ajouter un événement le ' + gEsc(court) + '</button>'
      + (l.map(ligneEv).join("") || '<p class="petit">Rien ce jour-là.</p>');
  }
  function gaDecaler(n) {
    if (GA_VUE === "mois") { GA_MOIS.setMonth(GA_MOIS.getMonth() + n); }
    else { var r = gaRef(); r.setDate(r.getDate() + n * (GA_VUE === "jour" ? 1 : 7)); GA_REF = r; GA_MOIS = new Date(r.getFullYear(), r.getMonth(), 1); }
    dessinerAgenda();
  }
  $("ga-prec").addEventListener("click", function () { gaDecaler(-1); });
  $("ga-suiv").addEventListener("click", function () { gaDecaler(1); });
  $("ga-prec").insertAdjacentHTML("beforebegin", "");
  $("ga-prec").parentNode.insertAdjacentHTML("beforebegin", '<div id="ga-vues" class="ga-vues" role="tablist"><button type="button" data-gv="mois" class="on">Mois</button><button type="button" data-gv="semaine">Semaine</button><button type="button" data-gv="jour">Jour</button></div>');
  $("ga-vues").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gv]"); if (!b) return;
    GA_VUE = b.dataset.gv; GA_REF = GA_SEL ? new Date(GA_SEL + "T12:00:00") : (GA_VUE === "mois" ? null : new Date());
    if (GA_VUE === "mois" && GA_REF) GA_MOIS = new Date(GA_REF.getFullYear(), GA_REF.getMonth(), 1);
    dessinerAgenda();
  });
  // Semaine : toucher le nom d'un jour ouvre la vue Jour.
  $("ga-liste").addEventListener("click", function (e) {
    var j = e.target.closest("[data-gv-jour]"); if (!j) return;
    GA_SEL = j.dataset.gvJour; GA_VUE = "jour"; GA_REF = new Date(GA_SEL + "T12:00:00"); dessinerAgenda();
  });
  $("ga-grille").addEventListener("click", function (e) {
    var c = e.target.closest("[data-ga-jour]"); if (!c) return;
    var d = c.dataset.gaJour;
    GA_SEL = GA_SEL === d ? null : d;   // retoucher le jour sélectionné : retour au mois
    dessinerAgenda();
    if (GA_SEL && !evenements().some(function (x) { return x.date === d; })) { formRdv({ date: d }); $("gr-form").scrollIntoView({ behavior: "smooth", block: "center" }); }
    else $("ga-liste").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  function ouvrirDepuisAgenda(e) {
    if (e.target.closest("[data-gcal]")) return;   // lien Google Agenda : on le laisse s'ouvrir
    if (e.target.id === "ga-tout") { e.preventDefault(); GA_SEL = null; dessinerAgenda(); return; }
    var l = e.target.closest("[data-ga-com]"); if (!l) return;
    if (l.dataset.gaDoc) {
      var nf = Array.prototype.filter.call(document.querySelectorAll("nav button"), function (x) { return x.dataset.onglet === "factu"; })[0];
      if (nf) nf.click(); ouvrirDoc(l.dataset.gaDoc, l.dataset.gaNum); return;
    }
    var nb = Array.prototype.filter.call(document.querySelectorAll("nav button"), function (x) { return x.dataset.onglet === "clients"; })[0];
    if (nb) nb.click();
    /* Action ou échange : ouvert directement en modification ; après l'enregistrement, retour à l'agenda. */
    var ech = l.dataset.gaEch ? (G.Echanges || []).filter(function (x) { return x.id === l.dataset.gaEch; })[0] : null;
    $("g-commune").value = l.dataset.gaCom; G_CONTACT = null; G_ECHANGE = ech ? Object.assign({}, ech) : null; G_AUTO = null; dessinerFiche();
    GA_RETOUR = !!ech;
    try { GF_PANE = "echanges"; gfAppliquerPane(); } catch (er) {}   // sous-onglet Échanges de la fiche
    setTimeout(function () { ($(ech ? "g-echange-form" : "g-echanges") || {}).scrollIntoView && $(ech ? "g-echange-form" : "g-echanges").scrollIntoView({ behavior: "smooth", block: "center" }); }, 60);
  }
  $("ga-liste").addEventListener("click", ouvrirDepuisAgenda);
  $("ga-retard").addEventListener("click", ouvrirDepuisAgenda);


  /* ——— Tarifs : facturation de base (mode par défaut) et catalogue (abonnement, options) ——— */
  var G_UNITES = [["point_an", "par point et par an"], ["point_mois", "par point et par mois"], ["point", "par point (une fois)"], ["forfait", "forfait (une fois)"], ["an", "par an"], ["mois", "par mois"], ["jour", "par jour"], ["heure", "par heure"], ["unite", "à l'unité"]];
  var G_RECURRENT = { point_an: 1, point_mois: 12, an: 1, mois: 12 };   // multiplicateur annuel ; absent = une fois
  function gNum(v) { return Number(String(v == null ? "" : v).replace(/\s/g, "").replace(",", ".")) || 0; }
  function gTarifs(cat) {
    return (G.Tarifs || []).filter(function (t) { return t.actif !== "non" && (!cat || t.categorie === cat); })
      .sort(function (a, b) { return gNum(a.ordre) - gNum(b.ordre) || String(a.libelle).localeCompare(b.libelle, "fr"); });
  }
  function gPrix(code) { var t = (G.Tarifs || []).filter(function (x) { return x.code === code; })[0]; return t ? gNum(t.prix_ht) : 0; }
  function gModeDefaut() { return gReglage("mode_facturation_defaut") === "mensuel" ? "mensuel" : "annuel"; }
  // Prix annuel d'un point pour une commune : contrat (onglet Communes), sinon catalogue selon le mode de facturation.
  var G_UNITES_TRANCHE = [["point_an", "par point et par an"], ["point_mois", "par point et par mois"], ["forfait_an", "forfait par an"], ["forfait_mois", "forfait par mois"]];
  function gTranches() {
    return (G && G.Tarifs || []).filter(function (t) { return t.categorie === "tranche" && t.actif !== "non"; }).sort(function (a, b) { return gNum(a.de) - gNum(b.de); });
  }
  // Abonnement HT/an pour un nombre de points : contrat de la commune, sinon tranches, sinon prix par point ; remise de la fiche appliquée.
  function gAbonnement(points, c, ct) {
    c = c || {}; ct = ct || {}; points = Number(points) || 0;
    var brut = 0, source = "", mode = c.mode_facturation || gModeDefaut(), tr = gTranches();
    var calcul = c.calcul_abonnement || (gReglage("calcul_abonnement") === "tranches" ? "tranches" : "point");
    if (calcul === "negocie" && gNum(c.prix_negocie)) {
      var pn = gNum(c.prix_negocie), un = c.unite_negociee || "point_an";
      brut = un === "point_an" ? points * pn : un === "point_mois" ? points * pn * 12 : un === "forfait_mois" ? pn * 12 : pn;
      source = "prix négocié " + gEuros(pn) + " " + gLib(G_UNITES_TRANCHE, un); mode = /mois/.test(un) ? "mensuel" : "annuel";
    }
    else if (gNum(ct.tarif_point)) { brut = points * gNum(ct.tarif_point); source = gEuros(ct.tarif_point) + "/point (contrat)"; }
    else if (calcul === "tranches" && tr.length) {
      var t = tr.filter(function (x) { return points >= gNum(x.de) && (!gNum(x.a) || points <= gNum(x.a)); })[0] || tr[tr.length - 1];
      var p = gNum(t.prix_ht), u = t.unite;
      brut = u === "point_an" ? points * p : u === "point_mois" ? points * p * 12 : u === "forfait_mois" ? p * 12 : p;
      source = "tranche " + gNum(t.de) + (gNum(t.a) ? "–" + gNum(t.a) : " et +") + " pts : " + gEuros(p) + " " + gLib(G_UNITES_TRANCHE, u);
      mode = /mois/.test(u) ? "mensuel" : "annuel";
    } else { var tp = gTarifPoint(c, ct); brut = points * tp.an; source = tp.source; mode = tp.mode; }
    var remise = Math.min(100, Math.max(0, gNum(c.remise_pct)));
    return { brut: brut, an: brut * (1 - remise / 100), source: source, mode: mode, remise: remise };
  }
  function gTarifPoint(c, ct) {
    c = c || {}; ct = ct || {};
    var mode = c.mode_facturation || gModeDefaut();
    if (gNum(ct.tarif_point)) return { an: gNum(ct.tarif_point), mode: mode, source: "tarif du contrat" };
    var an = gPrix("point_annuel"), mois = gPrix("point_mensuel");
    if (mode === "mensuel" && mois) return { an: mois * 12, mois: mois, mode: mode, source: gEuros(mois) + "/point/mois" };
    if (an) return { an: an, mode: mode, source: gEuros(an) + "/point/an" };
    if (mois) return { an: mois * 12, mois: mois, mode: mode, source: gEuros(mois) + "/point/mois" };
    var anc = gNum(gReglage("tarif_point_defaut"));
    return { an: anc, mode: mode, source: anc ? gEuros(anc) + "/point/an" : "" };
  }
  // Options cochées d'une fiche : « code:quantité;code:quantité ».
  /* Prix spécial d'une option pour une commune : « code:quantité:prix » dans Clients.options. */
  function gLirePrix(t) { var o = {}; String(t || "").split(";").forEach(function (p) { var x = p.split(":"); if (x[0] && x[2] !== undefined && x[2] !== "") o[x[0].trim()] = gNum(x[2]); }); return o; }
  function gPrixOpt(t, prix) { return prix && prix[t.code] !== undefined ? prix[t.code] : gNum(t.prix_ht); }
  function gQteSens(u) { return /^point/.test(u) ? "nombre de points" : u === "heure" ? "nombre d'heures" : u === "jour" ? "nombre de jours" : u === "an" || u === "mois" ? "quantité " + (u === "an" ? "par an" : "par mois") : u === "unite" ? "nombre d'unités" : "nombre de fois"; }
  function gLireOptions(t) { var o = {}; String(t || "").split(";").forEach(function (p) { var x = p.split(":"); if (x[0]) o[x[0].trim()] = gNum(x[1]) || 1; }); return o; }
  // Proposition chiffrée : abonnement + options, remise appliquée.
  function gProposition(com, c, opts, offertes) {
    offertes = offertes || {};
    var ct = (G.communes || []).filter(function (x) { return x.commune === com; })[0] || {};
    var pt = gPotentiel(com), ab = gAbonnement(pt.points, c, ct), tp = ab, remise = Math.min(100, Math.max(0, gNum(c.remise_pct)));
    var l = [], rec = 0, une = 0;
    if (pt.points && ab.brut) { rec += ab.brut; l.push(["Abonnement : " + pt.points + " point(s) — " + ab.source, ab.brut, "an"]); }
    gTarifs("option").forEach(function (t) {
      if (!opts[t.code]) return;
      var pr = gPrixOpt(t, gLirePrix(c.options)), special = Math.abs(pr - gNum(t.prix_ht)) > 0.001;
      var q = opts[t.code], m = G_RECURRENT[t.unite], mt = q * pr, lib = t.libelle + " : " + q + " × " + gEuros(pr) + " " + gLib(G_UNITES, t.unite) + (special ? " (prix spécial, catalogue " + gEuros(t.prix_ht) + ")" : "");
      if (offertes[t.code]) { l.push([lib + " — offert (parrainage" + (c.parrain ? " de " + gNomCommune(c.parrain) : "") + ")", 0, m ? "an" : "une", m ? mt * m : mt]); return; }
      if (m) { rec += mt * m; l.push([lib, mt * m, "an"]); }
      else { une += mt; l.push([lib, mt, "une"]); }
    });
    var k = 1 - remise / 100;
    var offert = l.reduce(function (s, x) { return s + (x[3] || 0); }, 0);
    return { lignes: l, recurrent: rec * k, uneFois: une * k, remise: remise, brut: rec + une, mode: tp.mode, offert: offert };
  }
  function dessinerConditions() {
    var com = $("g-commune").value, box = $("gf-conditions"); if (!box || !com) return;
    var opts = {}; Array.prototype.forEach.call(box.querySelectorAll("input[data-opt]"), function (i) { if (i.checked) { var q = box.querySelector('input[data-qte="' + i.dataset.opt + '"]'); opts[i.dataset.opt] = gNum(q && q.value) || 1; } });
    var lu = lireConditions(), off = {}; lu.options_offertes.split(";").forEach(function (k) { if (k) off[k] = 1; });
    Array.prototype.forEach.call(box.querySelectorAll("input[data-offert]"), function (i) { i.disabled = !lu.parrain || !box.querySelector('input[data-opt="' + i.dataset.offert + '"]').checked; });
    $("gf-negocie").style.display = lu.calcul_abonnement === "negocie" ? "flex" : "none";
    Array.prototype.forEach.call(box.querySelectorAll("[data-tot]"), function (el) {
      var k = el.dataset.tot, q = gNum((box.querySelector('input[data-qte="' + k + '"]') || {}).value), pe = box.querySelector('input[data-prix="' + k + '"]'), pv = gNum(pe && pe.value);
      var t = gTarifs("option").filter(function (x) { return x.code === k; })[0], sp = t && Math.abs(pv - gNum(t.prix_ht)) > 0.001;
      el.textContent = "= " + gEuros(q * pv); var sm = pe && pe.parentNode.querySelector("small"); if (sm) sm.innerHTML = sp ? '<b class="gfo-sp">prix spécial</b>' : "modifiable";
    });
    var c = Object.assign({}, gClient(com), lu);
    var p = gProposition(com, c, opts, off);
    $("gf-proposition").innerHTML = p.lignes.length
      ? p.lignes.map(function (x) { return '<div style="display:flex;gap:8px"><span style="flex:1">' + gEsc(x[0]) + '</span><b>' + (x[3] ? '<s style="color:var(--doux);font-weight:400">' + gEuros(x[3]) + '</s> 0 €' : gEuros(x[1]) + (x[2] === "an" ? "/an" : "")) + '</b></div>'; }).join("")
        + (p.offert ? '<div style="color:var(--ok, #2E7D4F)">Parrainage : ' + gEuros(p.offert) + ' HT offerts.</div>' : '')
        + '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--trait)">' + (p.remise ? 'Remise commerciale ' + p.remise + ' % appliquée.<br>' : '')
        + 'Récurrent : <b>' + gEuros(p.recurrent) + ' HT/an</b>' + (p.mode === "mensuel" ? ' (soit ' + gEuros(p.recurrent / 12) + '/mois)' : '')
        + (p.uneFois ? ' · Une fois : <b>' + gEuros(p.uneFois) + ' HT</b>' : '') + ' · <b>1re année : ' + gEuros(p.recurrent + p.uneFois) + ' HT</b></div>'
      : 'Renseignez les prix dans l\'onglet Tarifs pour chiffrer la proposition.';
  }
  function htmlConditions(c) {
    var opts = gLireOptions(c.options), prixC = gLirePrix(c.options), pts = gPotentiel(c.commune).points || 1, off = {};
    String(c.options_offertes || "").split(";").forEach(function (k) { if (k) off[k] = 1; });
    var options = gTarifs("option");
    return '<div id="gf-conditions" style="margin-top:12px;padding:10px 12px;background:#FAF8F3;border:1px solid var(--trait);border-radius:9px"><b>Offre commerciale de la commune</b>'
      + '<p class="petit" style="margin:4px 0 8px">Elle hérite de l\'offre de base (onglet Tarifs : ' + (gReglage("calcul_abonnement") === "tranches" ? "abonnement par tranches" : "prix unique par point") + ', facturation ' + (gModeDefaut() === "mensuel" ? "au mois" : "à l\'année") + '). Laissez « Par défaut » pour suivre la base, ou déclinez ici pour cette commune seulement : calcul, prix négocié, mode, remise, options, parrainage.</p>'
      + '<div style="display:grid;grid-template-columns:1fr 110px;gap:8px">'
      + '<div>' + gChamp("gf-mode", "Facturation de l'abonnement", c.mode_facturation || "", null, [["", "Par défaut (" + (gModeDefaut() === "mensuel" ? "au mois" : "à l'année") + ")"], ["annuel", "À l'année"], ["mensuel", "Au mois"]]) + '</div>'
      + '<div>' + gChamp("gf-remise", "Remise %", c.remise_pct || "", "number") + '</div></div>'
      + gChamp("gf-calcul", "Calcul de l'abonnement", c.calcul_abonnement || "", null, [["", "Par défaut (" + (gReglage("calcul_abonnement") === "tranches" ? "par tranches" : "prix unique par point") + ", onglet Tarifs)"], ["point", "Prix unique par point (catalogue)"], ["tranches", "Par tranches"], ["negocie", "Prix négocié pour cette commune"]])
      + '<div id="gf-negocie" style="display:' + (c.calcul_abonnement === "negocie" ? "flex" : "none") + ';flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px"><input id="gf-prixneg" type="number" min="0" step="any" placeholder="Prix" value="' + gEsc(c.prix_negocie || "") + '" style="width:100px;margin:0"> € HT '
      + '<select id="gf-uniteneg" style="flex:1;min-width:150px;margin:0">' + G_UNITES_TRANCHE.map(function (u) { return '<option value="' + u[0] + '"' + (u[0] === (c.unite_negociee || "point_an") ? " selected" : "") + '>' + u[1] + '</option>'; }).join("") + '</select></div>'

      + '<div class="petit" style="margin-top:8px"><b>Options pour le devis</b></div>'
      + (options.length ? options.map(function (t) {
          var q = opts[t.code] || (/point/.test(t.unite) ? pts : 1);
          var pr = gPrixOpt(t, prixC), special = Math.abs(pr - gNum(t.prix_ht)) > 0.001;
          return '<div class="gfo-l"><input type="checkbox" class="gfo-c" data-opt="' + gEsc(t.code) + '" id="gfo-' + gEsc(t.code) + '"' + (opts[t.code] ? ' checked' : '') + '>'
            + '<label for="gfo-' + gEsc(t.code) + '" class="gfo-lib"><b>' + gEsc(t.libelle) + '</b><span class="gfo-base">Catalogue : ' + (gNum(t.prix_ht) ? gEuros(t.prix_ht) + ' HT' : 'prix à définir') + ' ' + gEsc(gLib(G_UNITES, t.unite)) + '</span></label>'
            + '<div class="gfo-ch"><label>Quantité<small>' + gEsc(gQteSens(t.unite)) + '</small><input type="number" min="0" step="any" data-qte="' + gEsc(t.code) + '" value="' + gEsc(q) + '"></label>'
            + '<span class="gfo-x">×</span><label>Prix HT<small>' + (special ? '<b class="gfo-sp">prix spécial</b>' : 'modifiable') + '</small><input type="number" min="0" step="0.01" data-prix="' + gEsc(t.code) + '" value="' + gEsc(String(Math.round(pr * 100) / 100)) + '"></label>'
            + '<span class="gfo-tot" data-tot="' + gEsc(t.code) + '">= ' + gEuros(q * pr) + '</span></div>'
            + '<label class="gfo-off" title="Offerte grâce au parrainage"><input type="checkbox" data-offert="' + gEsc(t.code) + '"' + (off[t.code] ? ' checked' : '') + '><span>🎁 Offerte</span></label></div>';
        }).join("") : '<p class="petit">Aucune option : ajoutez-en dans l\'onglet Tarifs.</p>')
      + '<div style="margin-top:10px">' + gChamp("gf-parrain", "Parrainage — commune qui a recommandé celle-ci", c.parrain || "", null, [["", "Aucun parrainage"]].concat(gCommunes().filter(function (x) { return x[0] !== c.commune; })), "cochez ensuite « offerte » sur la ou les options annulées") + '</div>'
      + '<div id="gf-proposition" class="petit" style="margin-top:10px"></div>'
      + '<button class="second" type="button" id="gf-devis" style="margin-top:10px;width:100%">Générer le devis (brouillon) avec ces conditions</button></div>';
  }
  function lireConditions() {
    var box = $("gf-conditions"), o = [];
    if (!box) return {};
    Array.prototype.forEach.call(box.querySelectorAll("input[data-opt]"), function (i) {
      if (!i.checked) return;
      var q = box.querySelector('input[data-qte="' + i.dataset.opt + '"]'), pe = box.querySelector('input[data-prix="' + i.dataset.opt + '"]');
      var t = gTarifs("option").filter(function (x) { return x.code === i.dataset.opt; })[0], base = t ? gNum(t.prix_ht) : 0, pv = pe && pe.value !== "" ? gNum(pe.value) : base;
      o.push(i.dataset.opt + ":" + (gNum(q && q.value) || 1) + (Math.abs(pv - base) > 0.001 ? ":" + pv : ""));
    });
    var off = [];
    Array.prototype.forEach.call(box.querySelectorAll("input[data-offert]"), function (i) { if (i.checked && box.querySelector('input[data-opt="' + i.dataset.offert + '"]').checked) off.push(i.dataset.offert); });
    var parrain = gVal("gf-parrain");
    var calcul = gVal("gf-calcul");
    return { mode_facturation: gVal("gf-mode"), remise_pct: gVal("gf-remise"), options: o.join(";"), parrain: parrain, options_offertes: parrain ? off.join(";") : "",
      calcul_abonnement: calcul, prix_negocie: calcul === "negocie" ? gVal("gf-prixneg").replace(",", ".") : "", unite_negociee: calcul === "negocie" ? gVal("gf-uniteneg") : "" };
  }
  $("g-fiche").addEventListener("input", function (e) { if (e.target.closest("#gf-conditions")) dessinerConditions(); });
  $("g-fiche").addEventListener("change", function (e) { if (e.target.closest("#gf-conditions")) dessinerConditions(); });

  /* ——— Déploiement depuis la fiche : ouvre « Créer » pré-rempli et lance la recherche de la commune ——— */
  function lancerDeploiement() {
    var com = $("g-commune").value, c = Object.assign({}, gClient(com), G_AUTO || {});
    var nom = c.ville || (gCommunes().filter(function (x) { return x[0] === com; })[0] || [com, com])[1];
    var insee = String(c.code_insee || ""), dep = insee ? (insee.slice(0, 2) === "97" ? insee.slice(0, 3) : insee.slice(0, 2)) : "";
    var nb = document.querySelector('nav button[data-onglet="commune"]'); if (nb) nb.click();
    var essais = 0;
    (function remplir() {
      var inp = document.getElementById("p-commune.nom");
      if (!inp) { if (++essais < 40) setTimeout(remplir, 250); return; }
      inp.value = nom; inp.dispatchEvent(new Event("input", { bubbles: true }));
      var d = document.getElementById("p-commune.departement");
      if (d && dep) { d.value = dep; d.dispatchEvent(new Event("input", { bubbles: true })); }
      var bt = Array.prototype.filter.call(inp.parentNode.querySelectorAll("button"), function (b) { return /Rechercher la commune/.test(b.textContent); })[0];
      if (bt) bt.click();
      inp.scrollIntoView({ behavior: "smooth", block: "center" });
    })();
  }
  $("g-fiche").addEventListener("click", function (e) { if (e.target.id === "gf-deployer") lancerDeploiement(); });

  main.insertAdjacentHTML("beforeend",
    '<section id="tarifs"><div class="carte"><h2>Facturation de base</h2>'
    + '<label for="gt-mode"><b>Facturation de l\'abonnement par défaut</b></label><select id="gt-mode"><option value="annuel">À l\'année (prix par point et par an)</option><option value="mensuel">Au mois (prix par point et par mois)</option></select>'
    + '<label for="gt-calcul"><b>Calcul de l\'abonnement</b></label><select id="gt-calcul"><option value="point">Prix unique par point (catalogue ci-dessous)</option><option value="tranches">Par tranches de nombre de points</option></select>'
    + '<p class="petit">Chaque commune peut avoir son propre mode et un taux de remise commerciale : dans sa fiche (onglet Clients), bloc « Conditions commerciales ».</p>'
    + '<button class="principal" id="gt-mode-ok" type="button">Enregistrer</button><div class="msg" id="msg-tarifs-base"></div></div>'
    + '<div class="carte"><h2>Tarif par tranches <button class="second" id="gtr-ajout" type="button" style="float:right;padding:4px 10px;font-size:13px">Ajouter une tranche</button></h2>'
    + '<p class="petit">Utilisé si « Calcul de l\'abonnement » est sur « Par tranches ». Exemple : de 1 à 3 points, 150 € par point et par an ; de 4 à 10, 120 € ; de 11 et plus (« à » vide), 100 €. Prix HT.</p>'
    + '<div id="gtr-liste" class="petit">—</div><div class="msg" id="msg-tranches"></div></div>'
    + '<div class="carte"><h2>Catalogue <button class="second" id="gt-nouveau" type="button" style="float:right;padding:4px 10px;font-size:13px">Nouvelle option</button></h2>'
    + '<p class="petit">Abonnement par point (à l\'année ou au mois) et options proposées dans les devis : installation, formation, maintenance… Prix HT. Le tableau est aussi dans l\'onglet « Tarifs » du classeur commun.</p>'
    + '<div id="gt-liste" class="petit">—</div><div id="gt-form" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--trait)" hidden></div><div class="msg" id="msg-tarifs"></div></div></section>');
  var GT = null;
  function dessinerTarifs() {
    if (!$("gt-liste") || !G) return;
    $("gt-mode").value = gModeDefaut();
    $("gt-calcul").value = gReglage("calcul_abonnement") === "tranches" ? "tranches" : "point";
    dessinerTranches();
    var tous = (G.Tarifs || []).slice().sort(function (a, b) { return gNum(a.ordre) - gNum(b.ordre); });
    var bloc = function (cat, titre) {
      var l = tous.filter(function (t) { return (t.categorie || "option") === cat; });
      return '<b>' + titre + '</b>' + (l.length ? '<table class="dns"><tr><th style="text-align:left">Libellé</th><th style="text-align:right">Prix HT</th><th style="text-align:left">Unité</th></tr>' + l.map(function (t) {
        return '<tr' + (t.actif === "non" ? ' style="opacity:.5"' : '') + '><td><a href="#" data-gt="' + gEsc(t.code) + '">' + gEsc(t.libelle) + '</a>' + (t.actif === "non" ? ' (inactif)' : '') + '</td><td style="text-align:right">' + (gNum(t.prix_ht) ? gEuros(t.prix_ht) : '<span style="color:var(--ko)">à définir</span>') + '</td><td>' + gEsc(gLib(G_UNITES, t.unite)) + '</td></tr>';
      }).join("") + '</table>' : '<p>Aucun.</p>');
    };
    $("gt-liste").innerHTML = (G.Tarifs ? "" : '<p>Onglet Tarifs pas encore créé : cliquez « Actualiser » dans l\'onglet Clients.</p>') + bloc("abonnement", "Abonnement") + '<div style="height:10px"></div>' + bloc("option", "Options");
  }
  function formTarif(t) {
    GT = t; var f = $("gt-form"); f.hidden = false; t = t || { categorie: "option", unite: "forfait", actif: "oui" };
    f.innerHTML = '<b>' + (GT ? "Modifier « " + gEsc(t.libelle) + " »" : "Nouvelle option") + '</b>'
      + gChamp("gt-libelle", "Libellé (repris sur le devis)", t.libelle)
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div>' + gChamp("gt-prix", "Prix HT (€)", t.prix_ht, "number") + '</div><div>' + gChamp("gt-unite", "Unité", t.unite, null, G_UNITES) + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 80px;gap:8px"><div>' + gChamp("gt-cat", "Catégorie", t.categorie, null, [["option", "Option"], ["abonnement", "Abonnement"]]) + '</div><div>' + gChamp("gt-actif", "Proposé", t.actif || "oui", null, [["oui", "Oui"], ["non", "Non (masqué)"]]) + '</div><div>' + gChamp("gt-ordre", "Ordre", t.ordre, "number") + '</div></div>'
      + gChamp("gt-desc", "Description", t.description, "zone")
      + '<div style="display:flex;gap:8px;margin-top:10px"><button class="second" type="button" id="gt-annuler" style="flex:1">Annuler</button>'
      + (GT && !/^point_(annuel|mensuel)$/.test(GT.code) ? '<button class="second" type="button" id="gt-suppr" style="flex:1;color:var(--ko)">Supprimer</button>' : '')
      + '<button class="principal" type="button" id="gt-ok" style="flex:2;margin-top:0">Enregistrer</button></div>';
    f.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  $("gt-liste").addEventListener("click", function (e) { var a = e.target.closest("[data-gt]"); if (!a) return; e.preventDefault(); formTarif((G.Tarifs || []).filter(function (t) { return t.code === a.dataset.gt; })[0]); });
  $("gt-nouveau").addEventListener("click", function () { formTarif(null); });
  $("gt-form").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "gt-annuler") { $("gt-form").hidden = true; GT = null; return; }
    if (b.id === "gt-suppr") { if (!confirm("Supprimer « " + GT.libelle + " » du catalogue ?")) return; gEnvoyer({ op: "supprimer", onglet: "Tarifs", cle: GT.code }, "msg-tarifs", "Supprimé du catalogue.").then(function () { $("gt-form").hidden = true; GT = null; }).catch(function () {}); return; }
    if (b.id === "gt-ok") {
      if (!gVal("gt-libelle")) { msg("msg-tarifs", "Indiquez un libellé.", "ko"); return; }
      var v = { code: GT ? GT.code : "", libelle: gVal("gt-libelle"), prix_ht: gVal("gt-prix").replace(",", "."), unite: gVal("gt-unite"), categorie: gVal("gt-cat"), actif: gVal("gt-actif"), ordre: gVal("gt-ordre"), description: gVal("gt-desc") };
      gEnvoyer({ op: "enregistrer", onglet: "Tarifs", valeurs: v }, "msg-tarifs", "Tarif enregistré.").then(function () { $("gt-form").hidden = true; GT = null; }).catch(function () {});
    }
  });
  $("gt-mode-ok").addEventListener("click", function () {
    msg("msg-tarifs-base", "Enregistrement…");
    api("gestion", { op: "enregistrer", onglet: "Emetteur", valeurs: { cle: "mode_facturation_defaut", valeur: $("gt-mode").value, description: "annuel ou mensuel : facturation par défaut de l'abonnement" } })
      .then(function () { return gEnvoyer({ op: "enregistrer", onglet: "Emetteur", valeurs: { cle: "calcul_abonnement", valeur: $("gt-calcul").value, description: "point : prix unique par point ; tranches : tarif par tranches de points" } }, "msg-tarifs-base", "Facturation de base enregistrée."); })
      .catch(function (e) { msg("msg-tarifs-base", e.message, "ko"); });
  });
  // Tranches : une ligne éditable par tranche (de, à, prix, unité), enregistrée dans l'onglet Tarifs (catégorie « tranche »).
  /* Avis AV-MWWDZ8WG-11 : chiffre d'affaires équivalent de la tranche, à l'année et au mois. */
  function caTranche(t) {
    var de = gNum(t.de), a = gNum(t.a), p = gNum(t.prix_ht), u = t.unite || "point_an";
    if (!de || !p) return "";
    var parAn = /mois$/.test(u) ? 12 : 1, forfait = /^forfait/.test(u);
    var bas = (forfait ? p : p * de) * parAn, haut = a ? (forfait ? p : p * a) * parAn : 0;
    var an = forfait || (a && a === de) ? gEuros(bas) : a ? gEuros(bas) + " à " + gEuros(haut) : "dès " + gEuros(bas);
    var mois = forfait || (a && a === de) ? gEuros(bas / 12) : a ? gEuros(bas / 12) + " à " + gEuros(haut / 12) : "dès " + gEuros(bas / 12);
    return '<div style="margin-top:10px;padding:10px 12px;background:#EEF5F0;border:1px solid #cfe3d6;border-radius:9px;font-size:18px;line-height:1.45;color:var(--encre)">'
      + '<div style="font-size:15px;color:var(--doux)">Chiffre d\'affaires de la tranche' + (forfait ? '' : ' (' + de + (a ? ' à ' + a + ' points' : ' points et plus') + ')') + '</div>'
      + '<div><b style="font-size:21px">' + an + '</b> HT par an</div><div><b style="font-size:21px">' + mois + '</b> HT par mois</div></div>';
  }
  function ligneTranche(t) {
    t = t || {};
    var champ = "width:72px;padding:8px;margin:0";
    return '<div data-gtr="' + gEsc(t.code || "") + '" style="padding:10px;margin-top:8px;border:1px solid var(--trait);border-radius:9px;background:#fff">'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">De <input type="number" min="1" placeholder="1" value="' + gEsc(t.de || "") + '" data-k="de" aria-label="De (points)" style="' + champ + '">'
      + ' à <input type="number" min="1" placeholder="et +" value="' + gEsc(t.a || "") + '" data-k="a" aria-label="À (points, vide = et plus)" style="' + champ + '"> point(s)</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px"><input type="number" min="0" step="any" placeholder="Prix" value="' + gEsc(t.prix_ht || "") + '" data-k="prix" aria-label="Prix HT" style="width:100px;padding:8px;margin:0"> € HT'
      + '<select data-k="unite" aria-label="Unité" style="flex:1;min-width:150px;margin:0">' + G_UNITES_TRANCHE.map(function (u) { return '<option value="' + u[0] + '"' + (u[0] === (t.unite || "point_an") ? " selected" : "") + '>' + u[1] + '</option>'; }).join("") + '</select></div>'
      + caTranche(t)
      + '<div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="principal" data-gtr-ok="1" style="flex:2;margin-top:0;padding:8px">Enregistrer la tranche</button>'
      + '<button type="button" class="second" data-gtr-suppr="1" style="flex:1;color:var(--ko)">Supprimer</button></div></div>';
  }
  function dessinerTranches() {
    var tr = (G.Tarifs || []).filter(function (t) { return t.categorie === "tranche"; }).sort(function (a, b) { return gNum(a.de) - gNum(b.de); });
    $("gtr-liste").innerHTML = tr.map(ligneTranche).join("") || '<p>Aucune tranche : « Ajouter une tranche ».</p>';
  }
  $("gtr-ajout").addEventListener("click", function () { var p = $("gtr-liste").querySelector("p"); if (p) p.remove(); $("gtr-liste").insertAdjacentHTML("beforeend", ligneTranche(null)); });
  $("gtr-liste").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var row = b.closest("[data-gtr]"), code = row.dataset.gtr, val = function (k) { return row.querySelector('[data-k="' + k + '"]').value.trim(); };
    if (b.dataset.gtrSuppr) {
      if (!code) { row.remove(); return; }
      if (!confirm("Supprimer cette tranche ?")) return;
      gEnvoyer({ op: "supprimer", onglet: "Tarifs", cle: code }, "msg-tranches", "Tranche supprimée.").catch(function () {}); return;
    }
    var de = gNum(val("de")), a = gNum(val("a"));
    if (!de || (a && a < de)) { msg("msg-tranches", "Indiquez « de » (et « à » supérieur ou égal, ou vide pour « et plus »).", "ko"); return; }
    gEnvoyer({ op: "enregistrer", onglet: "Tarifs", valeurs: { code: code, libelle: "Abonnement de " + de + (a ? " à " + a : " point(s) et plus") + (a ? " points" : ""), categorie: "tranche", unite: val("unite"), prix_ht: val("prix").replace(",", "."), de: String(de), a: a ? String(a) : "", actif: "oui", ordre: String(100 + de) } }, "msg-tranches", "Tranche enregistrée.").catch(function () {});
  });


  /* ——— Commune déployée : liens vers l'application de collecte et la météo, vignette météo ——— */
  function gSite(com) {
    var ct = (G.communes || []).filter(function (x) { return x.commune === com; })[0] || {}, s = String(ct.site || "").trim();
    if (!s) return "";
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    return s.replace(/\/+$/, "");
  }
  function htmlDeployee(com) {
    var s = gSite(com);
    if (!s) return '<p class="petit" style="margin-top:10px">✓ Commune déployée (adresse du site non renseignée dans l\'onglet Communes).</p>';
    return '<div style="margin-top:12px;padding:10px 12px;background:#EEF5F0;border:1px solid var(--trait);border-radius:9px"><b>Commune déployée</b>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'
      + '<a class="second" href="' + gEsc(s) + '/" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:9px 10px;border-radius:9px;border:1px solid var(--trait);background:#fff;text-decoration:none;font-weight:600">Application de collecte</a>'
      + '<a class="second" href="' + gEsc(s) + '/meteo/" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:9px 10px;border-radius:9px;border:1px solid var(--trait);background:#fff;text-decoration:none;font-weight:600">Météo détaillée</a></div>'
      + '<iframe src="' + gEsc(s) + '/meteo/widget.html" title="Météo de la propreté des points de collecte" loading="lazy" style="width:100%;height:420px;border:1px solid var(--trait);border-radius:10px;margin-top:10px;background:#fff"></iframe></div>';
  }

  $("ga-ics").addEventListener("click", exporterIcs);
  /* Google Agenda : n8n envoie toutes les échéances dans l'agenda « PAV — actions » (même compte Google que le workflow Garantie SAV). */
  var GA_SYNC = null;
  function syncAgendaPlusTard() { clearTimeout(GA_SYNC); GA_SYNC = setTimeout(function () { syncAgenda(true); }, 3000); }
  function syncAgenda(discret) {
    var b = $("ga-sync"); if (!discret) { b.disabled = true; alerteAgenda("Envoi vers Google Agenda…"); }
    return api("gestion", { op: "agenda" }).then(function (j) {
      var a = j.agenda || {};
      var suite = (a.cree && a.calendrier) ? api("gestion", { op: "enregistrer", onglet: "Emetteur", valeurs: { cle: "agenda_google_id", valeur: a.calendrier, description: "Agenda Google « PAV — actions » (créé par la console)" } }) : Promise.resolve();
      return suite.then(function () {
        if (a.cree && G && G.Emetteur) G.Emetteur.push({ cle: "agenda_google_id", valeur: a.calendrier });
        if (!discret || a.erreurs) alerteAgenda((a.cree ? "Agenda « PAV — actions » créé dans Google Agenda. " : "") + a.envoyes + " échéance(s) à jour dans Google Agenda" + (a.erreurs ? ", " + a.erreurs + " en erreur : " + a.erreur : "") + ".");
      });
    }).catch(function (e) { if (!discret) alerteAgenda("Google Agenda : " + e.message); }).then(function () { b.disabled = false; });
  }
  $("ga-sync").addEventListener("click", function () { syncAgenda(false); });

  /* ——— Devis depuis la fiche : abonnement 1re année + options cochées, parrainage et remise ——— */
  function genererDevis() {
    var com = $("g-commune").value; if (!com) throw new Error("aucune commune choisie");
    var lu = lireConditions(), c = Object.assign({}, gClient(com), G_AUTO || {}, lu);
    var opts = gLireOptions(lu.options), off = {}; String(lu.options_offertes || "").split(";").forEach(function (k) { if (k) off[k] = 1; });
    var ct = (G.communes || []).filter(function (x) { return x.commune === com; })[0] || {};
    var pt = gPotentiel(com), ab = gAbonnement(pt.points, c, ct), r2 = function (n) { return Math.round(n * 100) / 100; };
    var lignes = [], payant = 0, nom = gNomCommune(com);
    if (pt.points && ab.brut) {
      var forfait = /forfait/.test(ab.source);
      lignes.push({ designation: "Abonnement suivi des points de collecte — 1re année, " + pt.points + " point(s)" + (pt.estime ? " (estimation)" : "") + " — " + ab.source, site_code: "", quantite: forfait ? 1 : pt.points, prix_unitaire_ht: r2(forfait ? ab.brut : ab.brut / pt.points) });
      payant += ab.brut;
    }
    gTarifs("option").forEach(function (t) {
      if (!opts[t.code]) return;
      var q = opts[t.code], m = G_RECURRENT[t.unite] || 1, pu = gPrixOpt(t, gLirePrix(lu.options)) * m;
      lignes.push({ designation: t.libelle + (m > 1 ? " (12 mois)" : "") + " — " + gLib(G_UNITES, t.unite), site_code: "", quantite: q, prix_unitaire_ht: r2(pu) });
      if (off[t.code]) lignes.push({ designation: "Parrainage" + (c.parrain ? " de " + gNomCommune(c.parrain) : "") + " : " + t.libelle + " offerte", site_code: "", quantite: 1, prix_unitaire_ht: r2(-q * pu) });
      else payant += q * pu;
    });
    var remise = Math.min(100, Math.max(0, gNum(lu.remise_pct)));
    if (remise && payant) lignes.push({ designation: "Remise commerciale " + remise + " %", site_code: "", quantite: 1, prix_unitaire_ht: r2(-payant * remise / 100) });
    if (!lignes.length) throw new Error("rien à chiffrer : renseignez les prix (onglet Tarifs) et cochez des options");
    var nf = document.querySelector('nav button[data-onglet="factu"]'); if (nf) nf.click();
    ouvrirDoc("devis", "");
    $("gd-commune").value = com;
    $("gd-objet").value = "Suivi des points de collecte (PAV) — " + nom;
    G_DOC.lignes = lignes; dessinerLignes();
    msg("msg-doc", "Devis préparé depuis la fiche : vérifiez les lignes puis cliquez « Enregistrer ».", "info");
    var ht = lignes.reduce(function (s, l) { return s + l.quantite * l.prix_unitaire_ht; }, 0);
    return { lignes: lignes, ht: ht };
  }
  $("g-fiche").addEventListener("click", function (e) {
    if (e.target.id !== "gf-devis") return;
    try { genererDevis(); } catch (er) { msg("msg-fiche", er.message, "ko"); }
  });

  /* ——— Assistant : outils Clients, Carte, Agenda, Tarifs, Devis, Déploiement (il prépare, l'administrateur valide) ——— */
  function attendre(test, ms) {
    return new Promise(function (ok) { var t0 = Date.now(); (function boucle() { if (test() || Date.now() - t0 > ms) return ok(); setTimeout(boucle, 250); })(); });
  }
  function texte(id, max) { var e = $(id); return e ? e.innerText.replace(/\n{2,}/g, "\n").trim().slice(0, max || 2000) : ""; }
  // Retrouve une commune suivie (identifiant ou nom), sinon la prépare comme prospect depuis la liste des communes.
  function trouverCommune(q) {
    var s = slugCommune(q);
    var c = gCommunes().filter(function (x) { return x[0] === q || slugCommune(x[1]) === s || x[0] === s; })[0];
    if (c) return Promise.resolve(c[0]);
    return listeCommunes().then(function (l) {
      var k = choisirCommune(l, q);
      if (!k) throw new Error("commune introuvable : " + q);
      var st = suivie(k);
      if (!st.client && !st.connue) G.Clients.push({ commune: st.id, statut: "prospect", nom_officiel: "Mairie de " + k.nom, ville: k.nom, code_insee: k.code, population: String(k.population || ""), code_postal: (k.codesPostaux || [])[0] || "" });
      return st.id;
    });
  }
  function ouvrirFiche(q) {
    var p = G_CHARGE ? Promise.resolve() : chargerGestion();
    return p.then(function () { return trouverCommune(q); }).then(function (id) {
      var nb = document.querySelector('nav button[data-onglet="clients"]'); if (nb && !nb.classList.contains("actif")) nb.click();
      if ($("g-commune").value !== id) {
        dessinerGestion(); $("g-commune").value = id; G_CONTACT = null; G_ECHANGE = null; G_AUTO = null; cacher("msg-fiche"); dessinerFiche();
      }
      return attendre(function () { return !/Recherche des infos/.test($("msg-fiche").textContent); }, 12000).then(function () { return id; });
    });
  }
  function resumeFiche(id) {
    var c = Object.assign({}, gClient(id), G_AUTO || {});
    var ech = (G.Echanges || []).filter(function (e) { return e.commune === id && e.fait !== "oui" && (e.prochaine_action || e.echeance); }).map(function (e) { return (e.echeance || "sans date") + " : " + (e.prochaine_action || e.resume); });
    return "Fiche " + gNomCommune(id) + " (statut " + (c.statut || "prospect") + (G_AUTO ? ", infos publiques trouvées mais pas encore enregistrées" : "") + ")\n"
      + texte("g-potentiel", 300) + "\n" + texte("gf-infos", 700) + "\nChiffrage : " + texte("gf-proposition", 1200)
      + "\nContacts : " + ((G.Contacts || []).filter(function (k) { return k.commune === id; }).map(function (k) { return k.nom + (k.fonction ? " (" + k.fonction + ")" : ""); }).join(", ") || "aucun")
      + "\nDevis : " + ((G.Devis || []).filter(function (d) { return d.commune === id; }).map(function (d) { return d.numero + " " + gLib(G_ST_DEVIS, d.statut) + " " + gEuros(d.total_ht) + " HT"; }).join(" ; ") || "aucun")
      + "\nFactures : " + ((G.Factures || []).filter(function (f) { return f.commune === id; }).map(function (f) { return f.numero + " " + gLib(G_ST_FACT, f.statut) + " " + gEuros(f.total_ttc) + " TTC" + (f.echeance ? " échéance " + f.echeance : ""); }).join(" ; ") || "aucune")
      + "\nÀ faire : " + (ech.join(" ; ") || "rien") + ($("gf-deployer") ? "\nCommune pas encore déployée." : "\nCommune déployée.");
  }
  function appliquerConditions(a) {
    var box = $("gf-conditions"); if (!box) throw new Error("fiche non ouverte");
    var fixe = function (id, v) { var e = $(id); if (e && v !== undefined && v !== null) { e.value = String(v); e.dispatchEvent(new Event("change", { bubbles: true })); } };
    if (a.mode !== undefined) fixe("gf-mode", a.mode === "defaut" ? "" : a.mode);
    if (a.remise_pct !== undefined) fixe("gf-remise", a.remise_pct);
    if (a.calcul !== undefined) fixe("gf-calcul", a.calcul === "defaut" ? "" : a.calcul);
    if (a.prix_negocie !== undefined) { fixe("gf-calcul", "negocie"); fixe("gf-prixneg", a.prix_negocie); }
    if (a.unite_negociee !== undefined) fixe("gf-uniteneg", a.unite_negociee);
    if (a.parrain !== undefined) {
      if (!a.parrain) fixe("gf-parrain", "");
      else { var s = slugCommune(a.parrain), p = gCommunes().filter(function (x) { return x[0] === a.parrain || slugCommune(x[1]) === s; })[0]; if (!p) throw new Error("parrain inconnu (doit être une commune suivie) : " + a.parrain); fixe("gf-parrain", p[0]); }
    }
    if (Array.isArray(a.options)) {
      var voulu = {}; a.options.forEach(function (o) { voulu[o.code] = o; });
      Array.prototype.forEach.call(box.querySelectorAll("input[data-opt]"), function (i) {
        var o = voulu[i.dataset.opt]; i.checked = !!o;
        var q = box.querySelector('input[data-qte="' + i.dataset.opt + '"]'); if (o && o.quantite && q) q.value = o.quantite;
        var f = box.querySelector('input[data-offert="' + i.dataset.opt + '"]'); if (f) f.checked = !!(o && o.offerte);
      });
      var inconnus = a.options.filter(function (o) { return !box.querySelector('input[data-opt="' + o.code + '"]'); }).map(function (o) { return o.code; });
      if (inconnus.length) throw new Error("options inconnues : " + inconnus.join(", ") + " (codes du catalogue : " + gTarifs("option").map(function (t) { return t.code; }).join(", ") + ")");
    }
    dessinerConditions();
  }
  PAV.outils = {
    carte_afficher: function (a) {
      var nb = document.querySelector('nav button[data-onglet="carte"]'); if (nb && !nb.classList.contains("actif")) nb.click();
      if (a.centre) { $("gk-centre").value = a.centre; GK_CENTRE = null; }
      if (a.rayon_km) { var r = [5, 10, 15, 20, 30, 40, 50, 75].reduce(function (b, k) { return Math.abs(k - a.rayon_km) < Math.abs(b - a.rayon_km) ? k : b; }, 20); $("gk-rayon").value = String(r); $("gk-rayon").dataset.init = "1"; }
      $("gk-min").value = a.points_min || ""; $("gk-max").value = a.points_max || "";
      var st = Array.isArray(a.statuts) && a.statuts.length ? a.statuts : ["libre", "cours", "client", "perdu"];
      Array.prototype.forEach.call(document.querySelectorAll("#gk-filtres input[data-gkg]"), function (i) { i.checked = st.indexOf(i.dataset.gkg) >= 0; });
      if (a.points_min || a.points_max || st.length < 4) $("gk-filtres").open = true;
      $("gk-potentiel").innerHTML = "";
      return (G_CHARGE ? Promise.resolve() : chargerGestion()).then(function () {
        ouvrirCarteProspects(GK_CENTRE);
        return new Promise(function (ok) { setTimeout(ok, 400); }).then(function () { return attendre(function () { var t = $("gk-potentiel").innerText; return (/Total/.test(t) && !/Calcul du potentiel/.test(t)) || /ko/.test($("msg-carte").className); }, 30000); });
      }).then(function () {
        if (/ko/.test($("msg-carte").className)) throw new Error($("msg-carte").textContent);
        return texte("msg-carte", 300) + "\n" + texte("gk-potentiel", 2500);
      });
    },
    fiche_ouvrir: function (a) { return ouvrirFiche(a.commune).then(resumeFiche); },
    fiche_conditions: function (a) {
      return ouvrirFiche(a.commune).then(function (id) { appliquerConditions(a); return "Conditions remplies (non enregistrées) pour " + gNomCommune(id) + ".\nChiffrage : " + texte("gf-proposition", 1500) + "\nL'administrateur doit cliquer « Enregistrer la fiche »."; });
    },
    echange_preparer: function (a) {
      return ouvrirFiche(a.commune).then(function (id) {
        formEchange({ date: a.date || "", type: a.type || "appel", contact: a.contact || "", resume: a.resume || "", prochaine_action: a.prochaine_action || "", echeance: a.echeance || "" });
        $("g-echange-form").scrollIntoView({ behavior: "smooth", block: "center" });
        return "Échange prérempli pour " + gNomCommune(id) + " : l'administrateur doit cliquer « Ajouter ».";
      });
    },
    agenda_lister: function (a) {
      var p = G_CHARGE ? Promise.resolve() : chargerGestion();
      return p.then(function () {
        var j = Number(a.jours) || 14, auj = new Date().toISOString().slice(0, 10), fin = new Date(Date.now() + j * 864e5).toISOString().slice(0, 10);
        var ev = evenements().filter(function (x) { return !x.passe && (x.retard || (x.date >= auj && x.date <= fin)); });
        return ev.length ? ev.map(function (x) { return (x.retard ? "EN RETARD " : "") + x.date + " · " + x.nomCommune + " — " + x.titre; }).join("\n") : "Rien de prévu dans les " + j + " prochains jours, aucun retard.";
      });
    },
    devis_preparer: function (a) {
      return ouvrirFiche(a.commune).then(function (id) {
        if (a.mode !== undefined || a.remise_pct !== undefined || a.parrain !== undefined || a.calcul !== undefined || a.prix_negocie !== undefined || Array.isArray(a.options)) appliquerConditions(a);
        var d = genererDevis();
        return "Devis brouillon préparé pour " + gNomCommune(id) + " (non enregistré) :\n" + d.lignes.map(function (l) { return "- " + l.designation + " : " + l.quantite + " × " + gEuros(l.prix_unitaire_ht); }).join("\n")
          + "\nTotal HT " + gEuros(d.ht) + ". L'administrateur vérifie puis clique « Enregistrer » (onglet Factures). Les conditions modifiées de la fiche ne sont pas enregistrées tant qu'il ne clique pas « Enregistrer la fiche ».";
      });
    },
    deploiement_preparer: function (a) {
      return ouvrirFiche(a.commune).then(function (id) {
        if (!$("gf-deployer")) return gNomCommune(id) + " est déjà déployée : rien à préparer.";
        lancerDeploiement();
        return attendre(function () { var i = document.getElementById("p-commune.nom"), r = i && i.parentNode.querySelector("div.petit"); return r && /✓|Aucune|Plusieurs|impossible/.test(r.textContent) && !/Recherche des infos/.test(r.textContent); }, 20000).then(function () {
          var i = document.getElementById("p-commune.nom"), r = i && i.parentNode.querySelector("div.petit");
          return "Onglet « commune » prérempli pour " + gNomCommune(id) + " : " + (r ? r.textContent : "recherche lancée") + "\nÉtape suivante possible : brouillon_enregistrer (îlots OpenStreetMap intégrés), puis agents_preparer. Rien n'est créé avant la validation de l'administrateur.";
        });
      });
    },
    tarifs_lister: function () {
      var p = G_CHARGE ? Promise.resolve() : chargerGestion();
      return p.then(function () {
        var tr = gTranches();
        return "Calcul de l'abonnement : " + (gReglage("calcul_abonnement") === "tranches" ? "par tranches" : "prix unique par point") + ", facturation par défaut " + gModeDefaut()
          + "\nAbonnement : " + gTarifs("abonnement").map(function (t) { return t.code + " = " + (gNum(t.prix_ht) ? gEuros(t.prix_ht) : "à définir") + " " + gLib(G_UNITES, t.unite); }).join(" ; ")
          + "\nTranches : " + (tr.map(function (t) { return gNum(t.de) + (gNum(t.a) ? "–" + gNum(t.a) : " et +") + " pts : " + gEuros(t.prix_ht) + " " + gLib(G_UNITES_TRANCHE, t.unite); }).join(" ; ") || "aucune")
          + "\nOptions (codes) : " + gTarifs("option").map(function (t) { return t.code + " — " + t.libelle + " — " + (gNum(t.prix_ht) ? gEuros(t.prix_ht) : "à définir") + " " + gLib(G_UNITES, t.unite); }).join(" ; ");
      });
    }
  };
  // Ce que l'assistant voit en plus dans l'état de la console, selon l'onglet.
  PAV.etatGestion = function (o) {
    if (!G) return { gestion: "données Clients non chargées (elles le seront au premier outil)" };
    var e = { communes_suivies: gCommunes().map(function (c) { return c[0] + " (" + (gClient(c[0]).statut || "client") + ")"; }).join(", "), options_catalogue: gTarifs("option").map(function (t) { return t.code; }).join(", ") };
    if (o === "clients" && $("g-commune").value) e.fiche = resumeFiche($("g-commune").value).slice(0, 2500);
    if (o === "carte") e.carte = texte("msg-carte", 300) + "\n" + texte("gk-potentiel", 2000);
    if (o === "agenda") e.agenda = texte("ga-retard", 1000) + "\n" + texte("ga-liste", 1500);
    if (o === "factu") e.documents = texte("g-devis-liste", 1000) + "\n" + texte("g-factures-liste", 1000) + (G_DOC ? "\nDocument ouvert : " + texte("g-doc", 1500) : "");
    return { gestion: e };
  };


  /* ——— Fiche : devis et factures de la commune, avec leur statut ——— */
  var G_COUL_ST = { brouillon: "#9AA39B", envoye: "#2F6EA8", accepte: "#2E7D4F", refuse: "#B3261E", expire: "#5E6B63",
    emise: "#E08A00", deposee_chorus: "#7B4FA3", payee: "#2E7D4F", annulee: "#5E6B63" };
  (function () {
    var carteFiche = $("g-fiche").closest(".carte"); if (!carteFiche) return;
    carteFiche.insertAdjacentHTML("afterend", '<div class="carte"><h2>Devis et factures <button class="second" id="gfd-nouveau" type="button" style="float:right;padding:4px 10px;font-size:13px">Nouveau devis</button></h2><div id="g-fiche-docs" class="petit">—</div><div class="msg" id="msg-fiche-docs"></div></div>');
  })();
  function badge(st, liste) { return '<span style="display:inline-block;padding:1px 8px;border-radius:10px;color:#fff;font-size:12px;background:' + (G_COUL_ST[st] || "#9AA39B") + '">' + gEsc(gLib(liste, st)) + '</span>'; }
  // Cartes de devis / facture (fiche client et page Factures). avecCommune : affiche la commune (page Factures).
  // Compte Google des PDF archivés et de Gmail (réglage drive_compte de l'émetteur).
  function gCompte() { return (G && emet("drive_compte")) || "pav.collecte@gmail.com"; }
  function gDrive(u) { if (!u) return u; return u + (u.indexOf("?") < 0 ? "?" : "&") + "authuser=" + encodeURIComponent(gCompte()); }
  function gdfNum(x) { return String(x.numero || "").indexOf("BROUILLON") === 0 ? "Brouillon" : x.numero; }
  function gdfBrouillon(x) { return String(x.numero || "").indexOf("BROUILLON") === 0 || x.statut === "brouillon"; }
  function gdfAct(lib, attrs, cls) { return '<button type="button" class="' + (cls || "second") + '" ' + attrs + '>' + lib + '</button>'; }
  function gdfCarteDevis(d, avecCommune) {
    var auj = new Date().toISOString().slice(0, 10), fac = gdFactureDuDevis(d.numero);
    var info = d.statut === "accepte" ? "Accepté" + (d.accepte_le ? " le " + gDateFR(d.accepte_le) : "") + (d.accepte_par ? " par " + d.accepte_par : "")
      : d.statut === "envoye" && d.validite ? (d.validite < auj ? "Validité dépassée le " : "Valable jusqu'au ") + gDateFR(d.validite) : "";
    return '<div class="gdf-c" data-gdf-cle="' + gEsc([d.numero, gNomCommune(d.commune), d.commune, gClient(d.commune).nom_officiel, d.objet].join(" ").toLowerCase()) + '"><div class="gdf-h"><b>' + gEsc(gdfNum(d)) + '</b>' + badge(d.statut, G_ST_DEVIS) + '</div>'
      + (avecCommune ? '<div class="gdf-com">' + gEsc(gNomCommune(d.commune)) + '</div>' : '')
      + (d.objet ? '<div class="gdf-o">' + gEsc(d.objet) + '</div>' : '')
      + '<div class="gdf-m"><span>' + gDateFR(d.date) + (info ? '<br><small' + (d.statut === "envoye" && d.validite < auj ? ' class="ko"' : '') + '>' + gEsc(info) + '</small>' : '') + '</span><b>' + gEuros(d.total_ht) + ' <small>HT</small></b></div>'
      + (fac ? '<div class="gdf-lien">🧾 Facturé : <button type="button" class="gdf-lnk" data-gdoc="facture" data-num="' + gEsc(fac.numero) + '">' + gEsc(gdfNum(fac)) + '</button> ' + badge(fac.statut, G_ST_FACT) + '</div>' : '')
      + '<div class="gdf-a">' + gdfAct("Ouvrir", 'data-gdoc="devis" data-num="' + gEsc(d.numero) + '"') + gdfAct("📄 PDF", 'data-gpdf="devis" data-num="' + gEsc(d.numero) + '"', "second gd-pdfb")
      + (d.pdf_drive ? '<a class="second gdf-drive" href="' + gEsc(gDrive(d.pdf_drive)) + '" target="_blank" rel="noopener" title="Ouvrir avec ' + gEsc(gCompte()) + '">☁️ Drive</a>' : '')
      + (d.statut === "brouillon" || d.statut === "envoye" ? gdfAct(d.statut === "envoye" ? "📨 Renvoyer" : "📨 Soumettre", 'data-gsoum="' + gEsc(d.numero) + '"', d.statut === "brouillon" ? "principal" : "second") : '')
      + (d.statut === "accepte" && !fac ? gdfAct("🧾 Créer la facture", 'data-gfacturer="' + gEsc(d.numero) + '"', "principal") : '')
      + (gdfBrouillon(d) ? gdfAct("Supprimer", 'data-gsuppr-doc="devis" data-num="' + gEsc(d.numero) + '"', "second gdf-sup") : '') + '</div></div>';
  }
  function gdfCarteFacture(f, avecCommune) {
    var auj = new Date().toISOString().slice(0, 10);
    var retard = (f.statut === "emise" || f.statut === "deposee_chorus") && f.echeance && f.echeance < auj;
    var info = f.statut === "payee" ? "Payée" + (f.payee_le ? " le " + gDateFR(f.payee_le) : "")
      : f.echeance && (f.statut === "emise" || f.statut === "deposee_chorus") ? (retard ? "Échue depuis le " : "Échéance le ") + gDateFR(f.echeance) : f.statut === "brouillon" ? "À vérifier puis émettre" : "";
    var details = [gLib(G_TYPES_FACT, f.type), f.periode_debut ? "du " + gDateFR(f.periode_debut) + " au " + gDateFR(f.periode_fin) : ""].filter(Boolean).join(" · ");
    return '<div class="gdf-c' + (retard ? ' retard' : '') + '" data-gdf-cle="' + gEsc([f.numero, gNomCommune(f.commune), f.commune, gClient(f.commune).nom_officiel, f.ref_devis, f.ref_chorus].join(" ").toLowerCase()) + '"><div class="gdf-h"><b>' + gEsc(gdfNum(f)) + '</b>' + badge(f.statut, G_ST_FACT) + '</div>'
      + (avecCommune ? '<div class="gdf-com">' + gEsc(gNomCommune(f.commune)) + '</div>' : '')
      + '<div class="gdf-o">' + gEsc(details) + (f.ref_devis ? '<br><small>Devis d\'origine : ' + gEsc(f.ref_devis) + '</small>' : '') + (f.ref_chorus ? '<br><small>Chorus : ' + gEsc(f.ref_chorus) + '</small>' : '') + '</div>'
      + '<div class="gdf-m"><span>' + gDateFR(f.date) + (info ? '<br><small' + (retard ? ' class="ko"' : '') + '>' + gEsc(info) + '</small>' : '') + '</span><b>' + gEuros(f.total_ttc) + ' <small>TTC</small></b></div>'
      + '<div class="gdf-a">' + gdfAct("Ouvrir", 'data-gdoc="facture" data-num="' + gEsc(f.numero) + '"') + gdfAct("📄 PDF", 'data-gpdf="facture" data-num="' + gEsc(f.numero) + '"', "second gd-pdfb")
      + (f.pdf_drive ? '<a class="second gdf-drive" href="' + gEsc(gDrive(f.pdf_drive)) + '" target="_blank" rel="noopener" title="Ouvrir avec ' + gEsc(gCompte()) + '">☁️ Drive</a>' : '')
      + (f.statut !== "annulee" ? gdfAct(f.statut === "emise" ? "🏛 Déposer sur Chorus" : "🏛 Chorus", 'data-gch="' + gEsc(f.numero) + '"', f.statut === "emise" ? "principal" : "second") : '')
      + (gdfBrouillon(f) ? gdfAct("Supprimer", 'data-gsuppr-doc="facture" data-num="' + gEsc(f.numero) + '"', "second gdf-sup") : '') + '</div></div>';
  }
  function gdfResume(dv, fa) {
    var paye = fa.filter(function (f) { return f.statut === "payee"; }).reduce(function (s, f) { return s + gNum(f.total_ttc); }, 0);
    var du = fa.filter(function (f) { return f.statut === "emise" || f.statut === "deposee_chorus"; }).reduce(function (s, f) { return s + gNum(f.total_ttc); }, 0);
    var attente = dv.filter(function (d) { return d.statut === "envoye"; }).length;
    var aFacturer = dv.filter(function (d) { return d.statut === "accepte" && !gdFactureDuDevis(d.numero); });
    return '<div class="gdf-resume"><div><span>Encaissé</span><b>' + gEuros(paye) + '</b></div><div' + (du ? ' class="du"' : '') + '><span>À encaisser</span><b>' + gEuros(du) + '</b></div><div><span>Devis en attente</span><b>' + attente + '</b></div></div>'
      + '<ol class="gdf-etapes"><li>Devis</li><li>Accepté</li><li>Facture</li><li>Chorus</li><li>Payée</li></ol>'
      + (aFacturer.length ? '<div class="gdf-alerte">🧾 ' + aFacturer.length + ' devis accepté' + (aFacturer.length > 1 ? 's' : '') + ' à facturer.</div>' : '');
  }
  function dessinerDocsFiche() {
    var com = $("g-commune").value, box = $("g-fiche-docs"); if (!box) return;
    if (!com) { box.textContent = "—"; return; }
    var tri = function (a, b) { return (b.date || "").localeCompare(a.date || ""); };
    var dv = (G.Devis || []).filter(function (d) { return d.commune === com; }).sort(tri);
    var fa = (G.Factures || []).filter(function (f) { return f.commune === com; }).sort(tri);
    var h = gdfResume(dv, fa)
      + '<h3 class="gdf-t">Devis <span>' + dv.length + '</span></h3>' + (dv.length ? dv.map(function (d) { return gdfCarteDevis(d, false); }).join("") : '<p class="gdf-vide">Aucun devis. « Nouveau devis » le prépare depuis l\'offre de la fiche.</p>')
      + '<h3 class="gdf-t">Factures <span>' + fa.length + '</span></h3>' + (fa.length ? fa.map(function (f) { return gdfCarteFacture(f, false); }).join("") : '<p class="gdf-vide">Aucune facture. Elle se crée depuis un devis accepté (bouton « Créer la facture »).</p>');
    box.innerHTML = h;
  }
  $("g-fiche-docs").addEventListener("click", function (e) {
    var sp = e.target.closest("[data-gsuppr-doc]");
    if (sp) {
      e.preventDefault();
      if (!confirm("Supprimer ce " + (sp.dataset.gsupprDoc === "devis" ? "devis" : "brouillon de facture") + " (brouillon, avec ses lignes) ?")) return;
      if (G_DOC && G_DOC.d && G_DOC.d.numero === sp.dataset.num) { $("g-doc").hidden = true; G_DOC = null; }
      gEnvoyer({ op: "supprimer-document", type: sp.dataset.gsupprDoc, numero: sp.dataset.num }, "msg-fiche-docs", "Brouillon supprimé.").catch(function () {});
      return;
    }
    var a = e.target.closest("[data-gdoc]"); if (!a) return; e.preventDefault();
    var nf = document.querySelector('nav button[data-onglet="factu"]'); if (nf) nf.click();
    ouvrirDoc(a.dataset.gdoc, a.dataset.num);
  });
  $("gfd-nouveau").addEventListener("click", function () {
    try { genererDevis(); } catch (er) { var nf = document.querySelector('nav button[data-onglet="factu"]'); if (nf) nf.click(); ouvrirDoc("devis", ""); }
  });


  /* Rappel avant échéance : réglage (onglet Emetteur), un événement « Rappel J-N » est aussi envoyé dans Google Agenda. */
  function majRappelChamp() { if ($("ga-rappel") && G && document.activeElement !== $("ga-rappel")) $("ga-rappel").value = String(Number(gReglage("rappel_echeance_jours")) || 0); }
  $("ga-rappel-ok").addEventListener("click", function () {
    var n = Math.max(0, Math.min(365, Math.round(gNum($("ga-rappel").value))));
    alerteAgenda("Enregistrement…");
    api("gestion", { op: "enregistrer", onglet: "Emetteur", valeurs: { cle: "rappel_echeance_jours", valeur: String(n), description: "Rappel avant une échéance (facture, devis, anniversaire de contrat), en jours ; 0 = pas de rappel" } })
      .then(function () { return chargerGestion(true); })
      .then(function () { alerteAgenda(n ? "Rappel J-" + n + " enregistré : envoi vers Google Agenda…" : "Rappels désactivés : mise à jour de Google Agenda…"); return syncAgenda(false); })
      .catch(function (e) { alerteAgenda(e.message); });
  });
  /* — Avis des utilisateurs (onglet Avis du classeur commun, alimenté par le workflow n8n « avis des utilisateurs ») —
     Priorité (haute / normale / basse), case « traité », note de suivi (colonne suite). */
  var GA_PRIO = [["haute", "Haute"], ["normale", "Normale"], ["basse", "Basse"]];
  var GA_CRIT = { global: "Note globale", simplicite: "Simplicité", fiabilite: "Fiabilité", rapidite: "Rapidité", clarte: "Clarté", utilite: "Utilité", justesse: "Justesse", gain_temps: "Gain de temps" };
  function gavNotes(a) { var o = {}; String(a.notes_detail || "").split(";").forEach(function (x) { var p = x.split(":"); if (GA_CRIT[p[0]] && Number(p[1]) >= 1) o[p[0]] = Number(p[1]); }); return o; }
  var GA_ETATS = [["", "—"], ["a_faire", "À faire"], ["en_cours", "En cours"], ["realise", "Réalisé"], ["abandonne", "Abandonné"]];
  var GA_PAGES = { collecte: "Appli de tournée", meteo: "Météo", encart: "Encart du site", integrer: "Page « Intégrer »", console: "Console" };
  var GA_FILTRE = { vue: "afaire", commune: "", page: "" }, GA_ENVOI = {}, GA_EDIT = null, GA_NUM = {};
  main.insertAdjacentHTML("beforeend",
    '<section id="avis"><div class="carte"><h2>Avis des utilisateurs <button class="second" id="gav-recharger" type="button" style="float:right;padding:4px 10px;font-size:13px">Actualiser</button></h2>'
    + '<p class="petit">Envoyés depuis le bouton « Votre avis » de l\'appli de tournée, de la météo et de l\'encart des sites. Donnez une priorité, cochez « Validé » pour une idée retenue et « Traité » quand c\'est fait ; le crayon ✏️ permet de compléter l\'avis (précisions, note de suivi). Le texte d\'origine n\'est jamais modifié.</p>'
    + '<div id="gav-synthese"></div>'
    + '<div class="gav-filtres"><div class="gav-seg" id="gav-vue"><button type="button" data-v="afaire">À traiter</button><button type="button" data-v="valide">Validés</button><button type="button" data-v="traite">Traités</button><button type="button" data-v="tous">Tous</button></div>'
    + '<select id="gav-commune" aria-label="Commune"></select><select id="gav-page" aria-label="Page"></select></div>'
    + '<div class="msg" id="msg-avis"></div><div id="gav-liste" class="petit">—</div></div></section>'
    + '<style>'
    + '.gav-filtres{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}.gav-filtres select{width:auto;flex:1;min-width:140px;padding:8px 10px;font-size:15px}'
    + '.gav-seg{display:inline-flex;border:1px solid var(--trait);border-radius:9px;overflow:hidden}.gav-seg button{border:0;background:#fff;padding:8px 12px;font:600 14px system-ui;color:var(--vert);cursor:pointer}'
    + '.gav-seg button+button{border-left:1px solid var(--trait)}.gav-seg button.on{background:var(--vert);color:#fff}'
    + '.gav-syn{display:flex;gap:8px;flex-wrap:wrap}.gav-syn div{flex:1;min-width:90px;background:#FAF8F3;border:1px solid var(--trait);border-radius:9px;padding:8px 10px}.gav-syn b{display:block;font-size:20px;color:var(--vert)}'
    + '.gav-a{border:1px solid var(--trait);border-left:5px solid #c9c2b4;border-radius:10px;padding:10px 12px;margin-top:10px;background:#fff;font-size:15px;color:var(--encre)}'
    + '.gav-a.p-haute{border-left-color:var(--ko)}.gav-a.p-normale{border-left-color:var(--accent)}.gav-a.p-basse{border-left-color:#8fa79a}.gav-a.fait{opacity:.62}'
    + '.gav-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.gav-h .et{color:#E08A00;letter-spacing:1px;font-size:16px}.gav-h .d{color:var(--doux);font-size:13px;margin-left:auto}'
    + '.gav-tag{font-size:12px;padding:2px 8px;border-radius:999px;background:#EEF5F0;color:var(--vert);border:1px solid var(--trait)}'
    + '.gav-idee{margin:8px 0;white-space:pre-wrap}.gav-idee.vide{color:var(--doux);font-style:italic}'
    + '.gav-b{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px}.gav-b .gav-seg button{padding:6px 10px;font-size:13px}'
    + '.gav-b .gav-seg button.on[data-p=haute]{background:var(--ko)}.gav-b .gav-seg button.on[data-p=normale]{background:var(--accent)}.gav-b .gav-seg button.on[data-p=basse]{background:#6f8a7c}'
    + '.gav-ok{display:inline-flex;gap:6px;align-items:center;font-weight:600;color:var(--vert);cursor:pointer;margin:0;font-size:15px}.gav-ok input{width:22px;height:22px;margin:0;accent-color:var(--ok)}'
    + '.gav-crayon{border:1px solid var(--trait);background:#fff;border-radius:8px;width:32px;height:30px;padding:0;cursor:pointer;font-size:15px}.gav-crayon:hover{border-color:var(--accent);background:#FFF4DF}'
    + '.gav-et-a_faire{background:#FFF4DF;color:#8a5a00;border-color:#f0d9a8}.gav-et-en_cours{background:#E6F0FB;color:#1d4f86;border-color:#bcd3ee}.gav-et-realise{background:#E7F3EC;color:var(--ok);border-color:#bfdccb;font-weight:600}.gav-et-abandonne{background:#F3EFEA;color:var(--doux);text-decoration:line-through}'
    + '.gav-moy{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.gav-moy span{background:#FFF4DF;border:1px solid #f0d9a8;border-radius:999px;padding:4px 10px;font-size:14px}.gav-moy b{color:#8a5a00}.gav-moy i{color:var(--doux);font-style:normal;font-size:12px}'
    + '.gav-crits{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.gav-crits span{font-size:13px;background:#FAF8F3;border:1px solid var(--trait);border-radius:7px;padding:2px 8px}.gav-crits b{color:#C77700}'
    + '.gav-num{font:700 13px system-ui;color:var(--doux);background:#F3EFEA;border-radius:6px;padding:2px 7px}'
    + '.gav-v{background:#E7F3EC;color:var(--ok);border-color:#bfdccb;font-weight:600}'
    + '.gav-comp{margin:6px 0 8px;padding:8px 10px;background:#FAF8F3;border-left:3px solid var(--accent);border-radius:6px;white-space:pre-wrap;font-size:14px}.gav-comp b{display:block;font-size:12px;color:var(--doux);font-weight:600}'
    + '.gav-edit{margin-top:8px;padding:10px;background:#FAF8F3;border:1px solid var(--trait);border-radius:9px}.gav-edit textarea{font-size:15px}.gav-eb{display:flex;gap:8px;margin-top:10px}.gav-eb button{flex:1;margin-top:0}'
    + '.gav-suite{margin-top:8px;font-size:14px;min-height:38px;padding:8px 10px}.gav-meta{color:var(--doux);font-size:12px;margin-top:4px}'
    + '</style>');
  function gavListe() { return (G && G.Avis) || []; }
  function gavDate(s) { var d = new Date(String(s || "").replace(" ", "T")); return isNaN(d) ? String(s || "") : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  function gavTs(s) { var d = new Date(String(s || "").replace(" ", "T")); return isNaN(d) ? 0 : d.getTime(); }
  function gavFait(a) { return a.traite === "oui"; }
  function gavPrioRang(a) { return { haute: 0, normale: 1, basse: 2 }[a.priorite] != null ? { haute: 0, normale: 1, basse: 2 }[a.priorite] : 1; }
  function majBadgeAvis() {
    var b = document.querySelector('nav button[data-onglet="avis"]'); if (!b) return;
    var n = gavListe().filter(function (a) { return !gavFait(a); }).length;
    b.textContent = n ? "Avis (" + n + ")" : "Avis";
  }
  function dessinerAvis() {
    majBadgeAvis();
    if (!$("gav-liste") || !G) return;
    var tous = gavListe();
    // Synthèse
    var notes = tous.map(function (a) { return Number(a.note); }).filter(function (n) { return n >= 1 && n <= 5; });
    var moy = notes.length ? notes.reduce(function (s, n) { return s + n; }, 0) / notes.length : 0;
    var recents = tous.filter(function (a) { return gavTs(a.date) > Date.now() - 30 * 864e5; }).length;
    $("gav-synthese").innerHTML = '<div class="gav-syn"><div><b>' + tous.filter(function (a) { return !gavFait(a); }).length + '</b>à traiter</div>'
      + '<div><b>' + tous.filter(function (a) { return !gavFait(a) && a.priorite === "haute"; }).length + '</b>priorité haute</div>'
      + '<div><b>' + (notes.length ? moy.toFixed(1).replace(".", ",") + ' ★' : '—') + '</b>note moyenne (' + notes.length + ')</div>'
      + '<div><b>' + tous.filter(function (a) { return a.valide === "oui" && !gavFait(a); }).length + '</b>validés à faire</div>'
      + '<div><b>' + recents + '</b>sur 30 jours</div></div>'
      + (function () {
        var som = {}, nb = {};
        tous.forEach(function (a) { var n = gavNotes(a); Object.keys(n).forEach(function (k) { som[k] = (som[k] || 0) + n[k]; nb[k] = (nb[k] || 0) + 1; }); });
        var k = Object.keys(GA_CRIT).filter(function (x) { return nb[x]; });
        return k.length ? '<div class="gav-moy">' + k.map(function (x) { return '<span>' + GA_CRIT[x] + ' <b>' + (som[x] / nb[x]).toFixed(1).replace(".", ",") + (x === "global" ? ' ♥' : ' ★') + '</b> <i>(' + nb[x] + ')</i></span>'; }).join("") + '</div>' : '';
      })();
    // Filtres
    Array.prototype.forEach.call($("gav-vue").querySelectorAll("button"), function (b) { b.classList.toggle("on", b.dataset.v === GA_FILTRE.vue); });
    var coms = {}; tous.forEach(function (a) { if (a.commune) coms[a.commune] = 1; });
    $("gav-commune").innerHTML = '<option value="">Toutes les communes</option>' + Object.keys(coms).sort().map(function (c) { return '<option value="' + gEsc(c) + '"' + (c === GA_FILTRE.commune ? ' selected' : '') + '>' + gEsc(c) + '</option>'; }).join("");
    var pages = {}; tous.forEach(function (a) { if (a.page) pages[a.page] = 1; });
    $("gav-page").innerHTML = '<option value="">Toutes les pages</option>' + Object.keys(pages).sort().map(function (p) { return '<option value="' + gEsc(p) + '"' + (p === GA_FILTRE.page ? ' selected' : '') + '>' + gEsc(GA_PAGES[p] || p) + '</option>'; }).join("");
    // Liste : priorité puis plus récent (les traités par date seulement)
    var l = tous.filter(function (a) {
      if (GA_FILTRE.vue === "afaire" && gavFait(a)) return false;
      if (GA_FILTRE.vue === "traite" && !gavFait(a)) return false;
      if (GA_FILTRE.vue === "valide" && a.valide !== "oui") return false;
      if (GA_FILTRE.commune && a.commune !== GA_FILTRE.commune) return false;
      if (GA_FILTRE.page && a.page !== GA_FILTRE.page) return false;
      return true;
    }).sort(function (a, b) {
      if (gavFait(a) !== gavFait(b)) return gavFait(a) ? 1 : -1;
      if (!gavFait(a) && gavPrioRang(a) !== gavPrioRang(b)) return gavPrioRang(a) - gavPrioRang(b);
      return gavTs(b.date) - gavTs(a.date);
    });
    GA_NUM = {}; tous.slice().sort(function (a, b) { return gavTs(a.date) - gavTs(b.date); }).forEach(function (a, i) { if (a.id) GA_NUM[a.id] = i + 1; });
    if (!tous.length) { $("gav-liste").innerHTML = "Aucun avis reçu pour l'instant."; return; }
    if (!l.length) { $("gav-liste").innerHTML = GA_FILTRE.vue === "afaire" ? "Rien à traiter 🎉" : "Aucun avis pour ce filtre."; return; }
    $("gav-liste").innerHTML = l.map(function (a) {
      var p = a.priorite || "normale", id = a.id || "", n = gavNotes(a), kn = Object.keys(n);
      if (!kn.length && Number(a.note) >= 1) { n = { simplicite: Math.round(Number(a.note)) }; kn = ["simplicite"]; }
      var contact = a.contact ? (/@/.test(a.contact) ? '<a href="mailto:' + gEsc(a.contact) + '">' + gEsc(a.contact) + '</a>' : /^[+\d][\d .]{6,}$/.test(a.contact) ? '<a href="tel:' + gEsc(a.contact.replace(/\s/g, "")) + '">' + gEsc(a.contact) + '</a>' : gEsc(a.contact)) : "";
      var notes = kn.map(function (x) { var g = x === "global", v = n[x]; return '<span class="gav-n"><i>' + GA_CRIT[x] + '</i><b class="' + (g ? 'c' : 'e') + '">' + (g ? '♥' : '★').repeat(v) + '<s>' + (g ? '♥' : '★').repeat(5 - v) + '</s></b></span>'; }).join("");
      var meta = [gEsc(a.commune || "commune ?"), gEsc(GA_PAGES[a.page] || a.page || "page ?"), a.appareil ? gEsc(gavAppareil(a.appareil)) : ""].filter(Boolean).join(" · ");
      return '<article class="gav-a p-' + gEsc(p) + (gavFait(a) ? ' fait' : '') + '" data-gav="' + gEsc(id) + '">'
        + '<div class="gav-top"><span class="gav-num">n° ' + (GA_NUM[id] || "?") + '</span><span class="gav-quand">' + gEsc(gavDate(a.date)) + '</span>'
        + '<span class="gav-badges">' + (a.valide === "oui" ? '<span class="gav-pill gav-v">✓ Validé</span>' : '')
        + (a.etat_traitement ? '<span class="gav-pill gav-et-' + gEsc(a.etat_traitement) + '">' + gEsc(gLib(GA_ETATS, a.etat_traitement)) + (a.version ? ' · ' + gEsc(a.version) : '') + '</span>' : '') + '</span>'
        + (id ? '<span class="gav-outils"><button type="button" class="gav-ic" data-gav-edit title="Modifier l\'avis (texte, précisions, suivi)" aria-label="Modifier l\'avis">✏️</button><button type="button" class="gav-ic" data-gav-suppr title="Supprimer l\'avis" aria-label="Supprimer l\'avis">🗑</button></span>' : '') + '</div>'
        + (GA_EDIT === id
          ? '<div class="gav-edit" style="margin-top:6px"><label>Texte de l\'avis (corrigeable : fautes, précision, reformulation)</label><textarea id="gav-e-idee" rows="4" maxlength="3000">' + gEsc(a.idee || "") + '</textarea></div>'
          : '<blockquote class="gav-idee' + (a.idee ? '' : ' vide') + '">' + (a.idee ? gEsc(a.idee) : 'Note seule, sans commentaire.') + '</blockquote>')
        + (notes ? '<div class="gav-notes">' + notes + '</div>' : '')
        + (a.complement && GA_EDIT !== id ? '<div class="gav-comp"><b>Précisions</b>' + gEsc(a.complement) + '</div>' : '')
        + (a.suite && GA_EDIT !== id ? '<div class="gav-suivi"><b>Suivi</b>' + gEsc(a.suite) + '</div>' : '')
        + '<div class="gav-meta">' + meta + (contact ? ' · ' + contact : '') + '</div>'
        + (GA_EDIT === id ? '<div class="gav-edit"><label>Précisions (contexte, reproduction, écran concerné, proposition…)</label>'
          + '<textarea id="gav-e-comp" rows="4" maxlength="3000" placeholder="Ex. sur Android, le bouton est sous le pouce ; proposer un bouton flottant en bas au centre.">' + gEsc(a.complement || "") + '</textarea>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label>État du traitement</label><select id="gav-e-etat">' + GA_ETATS.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === (a.etat_traitement || "") ? ' selected' : '') + '>' + x[1] + '</option>'; }).join("") + '</select></div>'
          + '<div><label>Version de réalisation</label><input id="gav-e-version" maxlength="40" placeholder="ex. V1.5.0" value="' + gEsc(a.version || "") + '"></div></div>'
          + '<label>Note de suivi</label><textarea id="gav-e-suite" rows="2" maxlength="2000" placeholder="Réponse faite, correctif prévu, version…">' + gEsc(a.suite || "") + '</textarea>'
          + '<div class="gav-eb"><button type="button" class="second" data-gav-annuler>Annuler</button><button type="button" class="principal" data-gav-ok>Enregistrer</button></div></div>' : '')
        + (id ? '<div class="gav-b"><div class="gav-seg" role="group" aria-label="Priorité">' + GA_PRIO.map(function (x) { return '<button type="button" data-p="' + x[0] + '"' + (x[0] === p ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join("") + '</div>'
          + '<span class="gav-sw"><label class="gav-ok"><input type="checkbox" data-gav-valide' + (a.valide === "oui" ? ' checked' : '') + '><span>Validé</span></label>'
          + '<label class="gav-ok"><input type="checkbox" data-gav-fait' + (gavFait(a) ? ' checked' : '') + '><span>Traité</span></label></span></div>'
          : '<div class="gav-meta" style="color:var(--ko)">Avis sans identifiant : actualisez pour le numéroter.</div>')
        + '</article>';
    }).join("");
  }
  function gavAppareil(ua) {
    ua = String(ua || "");
    var os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "";
    var nav = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
    return [os, nav].filter(Boolean).join(" · ") || ua.slice(0, 60);
  }
  function gavEnregistrer(id, valeurs, carte) {
    var a = gavListe().filter(function (x) { return x.id === id; })[0]; if (!a) return;
    var avant = { priorite: a.priorite, traite: a.traite, suite: a.suite, valide: a.valide, complement: a.complement, etat_traitement: a.etat_traitement, version: a.version, idee: a.idee };
    Object.assign(a, valeurs); dessinerAvis();   // affichage immédiat
    GA_ENVOI[id] = (GA_ENVOI[id] || Promise.resolve()).then(function () {
      return api("gestion", { op: "enregistrer", onglet: "Avis", valeurs: Object.assign({ id: id }, valeurs) });
    }).then(function () { msg("msg-avis", "Enregistré.", "ok"); setTimeout(function () { cacher("msg-avis"); }, 1500); })
      .catch(function (e) { Object.assign(a, avant); dessinerAvis(); msg("msg-avis", e.message, "ko"); });
  }
  $("gav-vue").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (!b) return; GA_FILTRE.vue = b.dataset.v; dessinerAvis(); });
  $("gav-commune").addEventListener("change", function () { GA_FILTRE.commune = this.value; dessinerAvis(); });
  $("gav-page").addEventListener("change", function () { GA_FILTRE.page = this.value; dessinerAvis(); });
  $("gav-recharger").addEventListener("click", function () { chargerGestion(); });
  $("gav-liste").addEventListener("click", function (e) {
    var c0 = e.target.closest("[data-gav]");
    if (c0 && e.target.closest("[data-gav-edit]")) { GA_EDIT = GA_EDIT === c0.dataset.gav ? null : c0.dataset.gav; dessinerAvis(); var t = $("gav-e-idee") || $("gav-e-comp"); if (t) t.focus(); return; }
    if (c0 && e.target.closest("[data-gav-annuler]")) { GA_EDIT = null; dessinerAvis(); return; }
    if (c0 && e.target.closest("[data-gav-suppr]")) {
      var idS = c0.dataset.gav;
      if (!confirm("Supprimer définitivement l'avis n° " + (GA_NUM[idS] || "?") + " du classeur ?")) return;
      api("gestion", { op: "supprimer", onglet: "Avis", cle: idS }).then(function () {
        G.Avis = gavListe().filter(function (x) { return x.id !== idS; }); dessinerAvis(); msg("msg-avis", "Avis supprimé.", "ok");
      }).catch(function (er) { msg("msg-avis", er.message, "ko"); });
      return;
    }
    if (c0 && e.target.closest("[data-gav-ok]")) {
      var v = { complement: $("gav-e-comp").value.trim(), suite: $("gav-e-suite").value.trim(), etat_traitement: $("gav-e-etat").value, version: $("gav-e-version").value.trim() };
      if ($("gav-e-idee")) v.idee = $("gav-e-idee").value.trim();
      if (v.etat_traitement === "realise") v.traite = "oui";
      GA_EDIT = null; gavEnregistrer(c0.dataset.gav, v); return;
    }
    var b = e.target.closest("button[data-p]"); if (!b) return;
    var c = b.closest("[data-gav]"); if (!c || !c.dataset.gav) return;
    gavEnregistrer(c.dataset.gav, { priorite: b.dataset.p });
  });
  $("gav-liste").addEventListener("change", function (e) {
    var c = e.target.closest("[data-gav]"); if (!c || !c.dataset.gav) return;
    if (e.target.matches("[data-gav-fait]")) gavEnregistrer(c.dataset.gav, { traite: e.target.checked ? "oui" : "non" });
    else if (e.target.matches("[data-gav-valide]")) gavEnregistrer(c.dataset.gav, { valide: e.target.checked ? "oui" : "non" });
    else if (e.target.matches("[data-gav-suite]")) gavEnregistrer(c.dataset.gav, { suite: e.target.value.trim() });
  });

  /* — Onglet Clients réorganisé : recherche en tête, une seule fiche en sous-onglets — */
  var GF_PANE = "fiche";
  /* Logo : celui de l'appli de la commune (déployée), sinon l'icône du site de la mairie, sinon l'initiale. */
  function gfLogo(com) {
    var site = gSite(com), cl = gClient(com), nom = gNomCommune(com), init = gEsc(String(nom || "?").charAt(0).toUpperCase());
    var src = site ? site + "/logo.png" : (cl.site_mairie ? "https://www.google.com/s2/favicons?sz=128&domain=" + encodeURIComponent(String(cl.site_mairie).replace(/^https?:\/\//, "").split("/")[0]) : "");
    var rond = '<span class="gf-logo gf-init"' + (src ? ' style="display:none"' : '') + '>' + init + '</span>';
    return (src ? '<img class="gf-logo" src="' + gEsc(src) + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-grid\'">' : '') + rond;
  }
  var GF_PANES = [["fiche", "Fiche"], ["offre", "Offre"], ["docs", "Devis & factures"], ["contacts", "Contacts"], ["echanges", "Échanges"], ["infos", "Infos & appli"]];
  function gfAppliquerPane() {
    Array.prototype.forEach.call(document.querySelectorAll("#clients .gf-pane"), function (p) { p.classList.toggle("on", p.dataset.p === GF_PANE); });
    Array.prototype.forEach.call(document.querySelectorAll("#gf-onglets button"), function (b) { b.classList.toggle("on", b.dataset.p === GF_PANE); });
    var ok = $("g-fiche-ok"); if (ok) ok.hidden = !(GF_PANE === "fiche" || GF_PANE === "offre");
    var t = $("gf-titre"); if (t && G) { var com = $("g-commune").value, cl = gClient(com); t.innerHTML = com ? gfLogo(com) + gEsc(gNomCommune(com)) + ' <span class="gf-statut">' + gEsc(gLib(G_STATUTS, cl.statut || "prospect")) + '</span>' : "Choisissez une commune"; }
  }
  (function reorganiserClients() {
    var sec = $("clients"); if (!sec || !$("g-fiche-docs")) return;
    var carte = function (id) { return $(id).closest(".carte"); };
    var cSuivi = carte("g-pipeline"), cFiche = carte("g-fiche"), cDocs = carte("g-fiche-docs"), cCont = carte("g-contacts"), cEch = carte("g-echanges");
    // Recherche
    cSuivi.querySelector("h2").insertAdjacentHTML("afterend", '<input id="g-cherche" type="search" autocomplete="off" placeholder="🔍 Rechercher : commune, contact, maire, SIRET, notes…" style="font-size:17px;padding:12px 14px;margin:2px 0 10px">');
    // Fiche : titre + sous-onglets ; les cartes Devis, Contacts, Échanges deviennent des sous-onglets
    cFiche.querySelector("h2").outerHTML = '<h2 id="gf-titre" style="font-size:22px">Fiche client</h2>';
    $("g-commune").insertAdjacentHTML("beforebegin", '<label for="g-commune" class="petit" style="margin-top:0">Changer de commune</label>');
    var lab = cFiche.querySelector('label[for="g-commune"] b'); if (lab) lab.parentNode.remove();
    $("g-fiche").insertAdjacentHTML("beforebegin", '<div id="gf-onglets" class="gf-onglets" role="tablist">' + GF_PANES.map(function (p) { return '<button type="button" role="tab" data-p="' + p[0] + '">' + p[1] + '</button>'; }).join("") + '</div>');
    var ok = $("g-fiche-ok"), msgF = $("msg-fiche");
    [["docs", cDocs], ["contacts", cCont], ["echanges", cEch]].forEach(function (x) {
      var d = document.createElement("div"); d.className = "gf-pane"; d.dataset.p = x[0];
      var h = x[1].querySelector("h2"); if (h) { h.style.fontSize = "17px"; }
      while (x[1].firstChild) d.appendChild(x[1].firstChild);
      cFiche.insertBefore(d, ok); x[1].remove();
    });
    if (msgF) cFiche.appendChild(msgF);
    $("gf-onglets").addEventListener("click", function (e) { var b = e.target.closest("button[data-p]"); if (!b) return; GF_PANE = b.dataset.p; gfAppliquerPane(); });
    // Recherche : filtre la liste, Entrée ouvre la première commune trouvée
    var norm = function (t) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
    function correspond(com, q) {
      var cl = gClient(com), txt = [com, gNomCommune(com), cl.nom_officiel, cl.siret, cl.maire, cl.ville, cl.notes, cl.email_facturation];
      (G.Contacts || []).forEach(function (k) { if (k.commune === com) txt.push(k.nom, k.email, k.telephone, k.fonction); });
      return norm(txt.join(" ")).indexOf(q) >= 0;
    }
    function filtrer() {
      var q = norm($("g-cherche").value.trim()), n = 0, premier = null;
      Array.prototype.forEach.call($("g-pipeline").querySelectorAll("tr"), function (tr) {
        var a = tr.querySelector("[data-gcom]"); if (!a) return;
        var vis = !q || correspond(a.dataset.gcom, q); tr.hidden = !vis; if (vis) { n++; if (!premier) premier = a; }
      });
      var m = $("g-cherche-n"); if (!m) { $("g-cherche").insertAdjacentHTML("afterend", '<div id="g-cherche-n" class="petit" style="margin:-4px 0 8px"></div>'); m = $("g-cherche-n"); }
      m.textContent = q ? n + " commune(s) trouvée(s)" + (n ? " — Entrée pour ouvrir la première" : "") : "";
      return premier;
    }
    $("g-cherche").addEventListener("input", filtrer);
    $("g-cherche").addEventListener("keydown", function (e) { if (e.key === "Enter") { var a = filtrer(); if (a) a.click(); } });
    $("g-pipeline").addEventListener("click", function (e) { if (e.target.closest("[data-gcom]")) setTimeout(function () { gfAppliquerPane(); cFiche.scrollIntoView({ behavior: "smooth", block: "start" }); }, 0); });
    var st = document.createElement("style");
    st.textContent = "#clients .gf-pane{display:none}#clients .gf-pane.on{display:block}"
      + ".gf-onglets{display:flex;gap:6px;overflow-x:auto;margin:12px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--trait)}"
      + ".gf-onglets button{flex:none;border:1px solid var(--trait);background:#fff;border-radius:9px 9px 0 0;padding:9px 12px;font:600 15px system-ui;color:var(--vert);cursor:pointer}"
      + ".gf-onglets button.on{background:var(--vert);color:#fff;border-color:var(--vert)}"
      + ".gf-statut{font-size:13px;font-weight:600;background:#EEF5F0;color:var(--vert);border:1px solid var(--trait);border-radius:999px;padding:3px 10px;vertical-align:middle}"
      + "#g-pipeline tr[hidden]{display:none}"
      + "#gf-titre{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.gf-logo{width:52px;height:52px;object-fit:contain;border-radius:10px;background:#fff;border:1px solid var(--trait);padding:3px;flex:none}"
      + ".gf-init{display:inline-grid;place-items:center;font:800 24px system-ui;color:#fff;background:var(--vert);border-color:var(--vert)}";
    document.head.appendChild(st);
    gfAppliquerPane();
  })();

  /* Fiche client : barème Bac-Score suivi par la commune, et accès direct à l'onglet Bac-Score. */
  function dessinerBaremeFiche(com) {
    var box = $("gf-bareme"); if (!box) return;
    var bouton = '<button type="button" class="second" data-gf-bareme="' + gEsc(com) + '" style="width:100%;margin-top:8px">Voir ou définir le barème de cette commune</button>';
    api("bareme", { commune: com }).then(function (j) {
      if ($("g-commune").value !== com || !$("gf-bareme")) return;
      var auj = new Date().toISOString().slice(0, 10), C = (j.commune || []).slice().sort(function (a, b) { return String(a.depuis).localeCompare(String(b.depuis)); });
      var enCours = C.filter(function (v) { return v.depuis <= auj; }).pop(), aVenir = C.filter(function (v) { return v.depuis > auj; })[0];
      var nomV = function (v) { return gEsc(v.nom || v.version || "version"); };
      var etat = (!enCours || enCours.bareme === "modele")
        ? '<b>Modèle commun</b>' + (enCours ? ' <span class="petit">(retour au modèle depuis le ' + gDateFR(enCours.depuis) + ')</span>' : ' <span class="petit">(pas de barème propre)</span>')
        : '<b>Barème propre : ' + nomV(enCours) + '</b> <span class="petit">depuis le ' + gDateFR(enCours.depuis) + '</span>';
      var futur = aVenir ? '<div class="petit" style="margin-top:4px">À venir le ' + gDateFR(aVenir.depuis) + ' : ' + (aVenir.bareme === "modele" ? "retour au modèle commun" : nomV(aVenir)) + '</div>' : '';
      box.innerHTML = '<div style="font-size:15px">Bac-Score : ' + etat + '</div>' + futur + bouton;
    }).catch(function () { if ($("gf-bareme")) $("gf-bareme").innerHTML = '<b>Bac-Score</b> <span class="petit">— état non disponible</span>' + bouton; });
  }
  $("g-fiche").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gf-bareme]"); if (!b) return;
    var nb = document.querySelector('nav button[data-onglet="bac"]'); if (!nb) return;
    nb.click();
    setTimeout(function () { var s = $("bac-portee"); if (!s) return; s.value = b.dataset.gfBareme; s.dispatchEvent(new Event("change")); window.scrollTo({ top: 0, behavior: "smooth" }); }, 50);
  });

  /* — Agenda : événements saisis librement (date, heure, note, commune ou contact facultatifs) — */
  var GR = null;
  $("ga-grille").insertAdjacentHTML("beforebegin", '<div style="margin:10px 0"><button type="button" class="principal" id="gr-nouveau" style="margin-top:0">+ Nouvel événement</button><div id="gr-form" hidden></div><div class="msg" id="msg-rdv"></div></div>');
  function formRdv(r) {
    GR = r || { date: new Date().toISOString().slice(0, 10) };
    var coms = gCommunes(), x = GR;
    var contacts = (G.Contacts || []).filter(function (k) { return !x.commune || k.commune === x.commune; });
    $("gr-form").innerHTML = '<div class="gr-carte">'
      + '<div class="gr-tete"><b>' + (x.id ? "Modifier l'événement" : "Nouvel événement") + '</b><button type="button" class="gr-x" id="gr-annuler-x" aria-label="Fermer">×</button></div>'
      + gChamp("gr-titre", "Titre", x.titre, "text", null, "ex. Réunion avec le maire, appel de suivi…")
      + '<div class="gr-quand"><div class="gr-c gr-d">' + gChamp("gr-date", "Date", x.date, "date") + '</div><div class="gr-c">' + gChamp("gr-heure", "Heure", x.heure, "time") + '</div><div class="gr-c">'
      + gChamp("gr-duree", "Durée", String(x.duree_min || "60"), null, [["15", "15 min"], ["30", "30 min"], ["45", "45 min"], ["60", "1 h"], ["90", "1 h 30"], ["120", "2 h"], ["180", "3 h"], ["240", "4 h"]]) + '</div></div>'
      + '<p class="petit gr-aide">Heure facultative : sans heure, l\'événement occupe la journée.</p>'
      + gChamp("gr-commune", "Client / prospect (facultatif)", x.commune || "", null, [["", "— aucun —"]].concat(coms))
      + gChamp("gr-contact", "Contact (facultatif)", x.contact || "", null, [["", "— aucun —"]].concat(contacts.map(function (k) { return [k.nom, k.nom + (k.fonction ? " — " + k.fonction : "") + (x.commune ? "" : " (" + gNomCommune(k.commune) + ")")]; })).concat(x.contact && !contacts.some(function (k) { return k.nom === x.contact; }) ? [[x.contact, x.contact]] : []))
      + gChamp("gr-note", "Note", x.note, "zone")
      + '<div class="gr-actions">' + (x.id ? '<button type="button" class="second" id="gr-suppr">Supprimer</button>' : '')
      + '<button type="button" class="second" id="gr-annuler">Annuler</button><button type="button" class="principal" id="gr-ok">Enregistrer</button></div>'
      + '<p class="petit gr-aide" style="margin-bottom:0">Envoyé dans Google Agenda : à l\'heure dite avec un rappel 30 min avant, ou sur la journée.</p></div>';
    $("gr-form").hidden = false; $("gr-titre").focus();
  }
  $("gr-nouveau").addEventListener("click", function () { formRdv(GA_SEL ? { date: GA_SEL } : null); });
  // Téléphone : le champ en cours de saisie remonte au-dessus du clavier.
  ["g-echange-form", "g-contact-form"].forEach(function (id) { if ($(id)) $(id).addEventListener("focusin", function (e) {
    var el = e.target; if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !/Mobi|Android/i.test(navigator.userAgent)) return;
    var haut = function () { var r = el.getBoundingClientRect(); if (Math.abs(r.top - 84) > 12) window.scrollBy({ top: r.top - 84, behavior: "smooth" }); };
    setTimeout(haut, 300); setTimeout(haut, 750);
  }); });
  $("gr-form").addEventListener("focusin", function (e) {
    var el = e.target; if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    /* Le champ remonte en haut de l'écran : le clavier occupe le bas sans le cacher. */
    var haut = function () { var r = el.getBoundingClientRect(); if (Math.abs(r.top - 84) > 12) window.scrollBy({ top: r.top - 84, behavior: "smooth" }); };
    setTimeout(haut, 300); setTimeout(haut, 750);
  });
  (function () { var st = document.createElement("style"); st.textContent =
    "#gr-form{padding-bottom:40vh}#gr-form[hidden]{display:none}"
    + ".gr-carte{margin-top:12px;padding:16px;border:1px solid var(--trait);border-radius:14px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.06)}"
    + ".gr-tete{display:flex;align-items:center;justify-content:space-between}.gr-tete b{font-size:19px}.gr-x{border:0;background:#F3EFEA;border-radius:50%;width:34px;height:34px;font-size:22px;line-height:1;cursor:pointer;color:var(--doux)}"
    + ".gr-quand{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:10px;align-items:end}.gr-c label{white-space:nowrap}"
    + "#gr-form input,#gr-form select{height:48px;box-sizing:border-box;margin:0;font-size:16px}#gr-form textarea{font-size:16px;min-height:90px}"
    + "#gr-form input[type=date],#gr-form input[type=time]{-webkit-appearance:none;appearance:none;min-width:0;width:100%;text-align:left;padding:0 10px;background:#fff}"
    + ".gr-aide{margin:6px 0 0;color:var(--doux)}"
    + ".gr-actions{display:flex;gap:8px;margin-top:14px}.gr-actions button{flex:1;margin:0;height:48px}#gr-ok{flex:2}#gr-suppr{color:var(--ko)}"
    + "@media(max-width:480px){.gr-quand{grid-template-columns:1fr 1fr}.gr-d{grid-column:1 / -1}}"
    + ".ga-l{display:grid;grid-template-columns:12px 46px 46px 1fr auto;gap:0 6px;align-items:baseline;padding:9px 2px;border-bottom:1px solid var(--trait);cursor:pointer;font-size:15px}"
    + ".ga-l:hover{background:#FAF8F3}.ga-pt{width:9px;height:9px;border-radius:50%;align-self:center}.ga-dt{font-variant-numeric:tabular-nums}.ga-hr{color:var(--vert);font-weight:700;font-variant-numeric:tabular-nums}"
    + ".ga-tx i{font-style:normal;color:var(--doux)}.ga-tx small{display:block;color:var(--doux);font-size:13px;white-space:pre-wrap;margin-top:2px}"
    + ".ga-del{border:0;background:transparent;font-size:18px;width:40px;height:36px;border-radius:8px;cursor:pointer;opacity:.6;align-self:center}.ga-del:hover{background:#FDECEA;opacity:1}.ga-ok{color:#2E7D4F;font-weight:700;opacity:.85}"
    + ".ga-j{min-height:48px;padding:3px 4px;border-radius:8px;border:1px solid var(--trait);background:#fff;cursor:pointer;box-sizing:border-box}"
    + ".ga-j:hover{border-color:var(--accent)}.ga-jn{font-size:13px;color:var(--doux)}"
    + ".ga-auj{background:var(--vert);border-color:var(--vert)}.ga-auj .ga-jn{color:#fff;font-weight:800}"
    + ".ga-sel{box-shadow:0 0 0 3px var(--accent);border-color:var(--accent)}"
    + ".ga-pts{display:flex;flex-wrap:wrap;gap:2px;align-items:center;margin-top:2px}.ga-pts span{width:8px;height:8px;border-radius:50%;box-shadow:0 0 0 1px #fff}.ga-pts b{font-size:11px;line-height:1;color:var(--doux)}.ga-auj .ga-pts b{color:#fff}"
    + ".ga-jt{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:17px}.ga-jt a{font-size:14px}"
    + ".ga-ajout{width:100%;margin:8px 0 4px}"
    + ".ga-vues{display:flex;gap:0;margin:0 0 8px;border:1px solid var(--trait);border-radius:10px;overflow:hidden}.ga-vues button{flex:1;border:0;background:#fff;padding:9px 0;font:600 15px system-ui;color:var(--vert);cursor:pointer}.ga-vues button+button{border-left:1px solid var(--trait)}.ga-vues button.on{background:var(--vert);color:#fff}"
    + ".ga-vj{border:1px solid var(--trait);border-radius:10px;padding:6px 10px;margin:8px 0;background:#fff}.ga-vj-auj{border-color:var(--vert);box-shadow:inset 4px 0 0 var(--vert)}.ga-vj-sel{box-shadow:0 0 0 2px var(--accent)}"
    + ".ga-vjt{display:flex;align-items:center;justify-content:space-between;gap:8px}.ga-vjt b{cursor:pointer;font-size:16px}.ga-tag{font-size:12px;font-weight:600;color:#fff;background:var(--vert);border-radius:6px;padding:1px 6px;margin-left:4px}"
    + ".ga-vjp{margin:0;padding:5px 10px;font-size:14px;white-space:nowrap;flex:none}.ga-vjv{margin:4px 0}.ga-vjs{margin:6px 0 0;font-weight:700}"
    + ".ga-ok:hover{background:#E6F2EA}.ga-bt{display:flex;align-self:center}.ga-auto{width:40px;text-align:center;font-size:14px;opacity:.45;align-self:center;cursor:help}";
    document.head.appendChild(st); })();
  $("gr-form").addEventListener("change", function (e) {
    if (e.target.id === "gr-commune") { GR = Object.assign({}, GR, lireRdv(), { contact: "" }); formRdv(GR); }
  });
  function lireRdv() { return { titre: gVal("gr-titre"), date: gVal("gr-date"), heure: gVal("gr-heure"), duree_min: gVal("gr-duree"), commune: gVal("gr-commune"), contact: gVal("gr-contact"), note: gVal("gr-note") }; }
  $("gr-form").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "gr-annuler" || b.id === "gr-annuler-x") { $("gr-form").hidden = true; GR = null; return; }
    if (b.id === "gr-suppr") {
      if (!confirm("Supprimer cet événement ? Il sera aussi retiré de Google Agenda.")) return;
      gEnvoyer({ op: "enregistrer", onglet: "Rendezvous", valeurs: { id: GR.id, statut: "annule" } }, "msg-rdv", "Événement supprimé.").then(function () { $("gr-form").hidden = true; GR = null; }).catch(function () {});
      return;
    }
    if (b.id === "gr-ok") {
      var v = lireRdv();
      if (!v.titre) { msg("msg-rdv", "Donnez un titre à l'événement.", "ko"); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) { msg("msg-rdv", "Choisissez une date.", "ko"); return; }
      if (GR && GR.id) v.id = GR.id; v.statut = GR && GR.statut === "fait" ? "fait" : "actif";
      gEnvoyer({ op: "enregistrer", onglet: "Rendezvous", valeurs: v }, "msg-rdv", "Événement enregistré : il part dans Google Agenda.").then(function () {
        $("gr-form").hidden = true; GR = null;
        var d = new Date(v.date + "T12:00:00"); GA_MOIS = new Date(d.getFullYear(), d.getMonth(), 1); dessinerAgenda();
      }).catch(function () {});
    }
  });
  // Clic sur un événement libre : on l'ouvre en modification (avant le clic « fiche de la commune »).
  ["ga-liste", "ga-retard"].forEach(function (id) {
    $(id).addEventListener("click", function (e) {
      var fa = e.target.closest("[data-ga-fait]");
      if (fa) {
        e.stopImmediatePropagation(); e.preventDefault();
        if (!confirm("Marquer cette action comme réalisée ? Elle reste dans l'agenda, en vert (✓), et est notée faite dans les échanges de la commune.")) return;
        gEnvoyer({ op: "enregistrer", onglet: "Echanges", valeurs: { id: fa.dataset.gaFait, fait: "oui" } }, "msg-rdv", "Action réalisée ✓").catch(function () {});
        return;
      }
      var au = e.target.closest(".ga-auto");
      if (au) { e.stopImmediatePropagation(); e.preventDefault(); msg("msg-rdv", au.title, "ok"); return; }
      var rf = e.target.closest("[data-gr-fait]");
      if (rf) {
        e.stopImmediatePropagation(); e.preventDefault();
        gEnvoyer({ op: "enregistrer", onglet: "Rendezvous", valeurs: { id: rf.dataset.grFait, statut: "fait" } }, "msg-rdv", "Événement réalisé ✓").catch(function () {});
        return;
      }
      var del = e.target.closest("[data-gr-suppr]");
      if (del) {
        e.stopImmediatePropagation(); e.preventDefault();
        var rr = (G.Rendezvous || []).filter(function (x) { return x.id === del.dataset.grSuppr; })[0];
        if (!confirm("Supprimer « " + ((rr && rr.titre) || "cet événement") + " » ? Il sera aussi retiré de Google Agenda.")) return;
        gEnvoyer({ op: "enregistrer", onglet: "Rendezvous", valeurs: { id: del.dataset.grSuppr, statut: "annule" } }, "msg-rdv", "Événement supprimé.").catch(function () {});
        return;
      }
      var l = e.target.closest("[data-ga-rdv]"); if (!l) return;
      e.stopImmediatePropagation(); e.preventDefault();
      var r = (G.Rendezvous || []).filter(function (x) { return x.id === l.dataset.gaRdv; })[0]; if (!r) return;
      formRdv(Object.assign({}, r)); $("gr-form").scrollIntoView({ behavior: "smooth", block: "center" });
    }, true);
  });
  $("ga-liste").addEventListener("click", function (e) {
    var a = e.target.closest("[data-gr-jour]"); if (!a) return; e.preventDefault(); e.stopImmediatePropagation();
    formRdv({ date: a.dataset.grJour }); $("gr-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }, true);

  /* Avis : présentation sobre (cartes aérées, citation, pastilles). */
  (function () { var st = document.createElement("style"); st.textContent =
    "#avis .carte{padding:18px}#avis h2{font-size:21px;letter-spacing:.01em}"
    + ".gav-syn{gap:10px}.gav-syn div{background:#fff;border:1px solid var(--trait);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--doux);box-shadow:0 1px 2px rgba(0,0,0,.04)}.gav-syn b{font-size:26px;font-weight:800;line-height:1.1}"
    + ".gav-moy{margin-top:10px}.gav-moy span{background:#fff;border-color:var(--trait);font-size:13px}"
    + ".gav-filtres{padding:10px 0;border-top:1px solid var(--trait);border-bottom:1px solid var(--trait);margin:14px 0 4px}"
    + "#gav-liste{display:grid;gap:12px;margin-top:12px}"
    + ".gav-a{margin:0;border:1px solid var(--trait);border-left:4px solid #c9c2b4;border-radius:14px;padding:14px 16px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.05)}"
    + ".gav-a.fait{opacity:.7;background:#FBFAF7}"
    + ".gav-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.gav-num{background:var(--vert);color:#fff;font:700 12px system-ui;border-radius:6px;padding:3px 8px}"
    + ".gav-quand{color:var(--doux);font-size:13px}.gav-badges{display:flex;gap:6px;flex-wrap:wrap}.gav-outils{margin-left:auto;display:flex;gap:4px}"
    + ".gav-pill{font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px;border:1px solid var(--trait)}"
    + ".gav-ic{border:0;background:transparent;border-radius:8px;width:34px;height:32px;cursor:pointer;font-size:16px;opacity:.65}.gav-ic:hover{background:#F3EFEA;opacity:1}"
    + ".gav-idee{margin:12px 0 10px;padding:2px 0 2px 14px;border-left:3px solid var(--trait);font-size:17px;line-height:1.5;color:var(--encre);white-space:pre-wrap}.gav-idee.vide{font-size:14px;color:var(--doux);font-style:italic}"
    + ".gav-notes{display:flex;flex-wrap:wrap;gap:6px 18px;margin:4px 0 8px}.gav-n{display:inline-flex;align-items:center;gap:6px;font-size:13px}.gav-n i{font-style:normal;color:var(--doux)}"
    + ".gav-n b{letter-spacing:1px;font-size:15px}.gav-n b.e{color:#E08A00}.gav-n b.c{color:#D6334A}.gav-n s{text-decoration:none;color:#DDD6C8}"
    + ".gav-comp,.gav-suivi{margin:8px 0;padding:8px 12px;border-radius:9px;font-size:14px;white-space:pre-wrap}.gav-comp{background:#FAF8F3}.gav-suivi{background:#EEF5F0;color:var(--vert)}"
    + ".gav-comp b,.gav-suivi b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--doux);margin-bottom:2px}"
    + ".gav-meta{font-size:12.5px;color:var(--doux);margin-top:6px}"
    + ".gav-b{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid #EFEAE0}"
    + ".gav-sw{display:flex;gap:8px}.gav-ok span{border:1px solid var(--trait);border-radius:999px;padding:6px 12px;font-size:14px}.gav-ok input{position:absolute;opacity:0;width:1px;height:1px}"
    + ".gav-ok input:checked+span{background:var(--ok);border-color:var(--ok);color:#fff}.gav-ok input:focus-visible+span{outline:2px solid var(--accent)}";
    document.head.appendChild(st); })();

  /* — Document imprimable (devis / facture) : modèle classique et professionnel, A4, enregistrable en PDF — */
  function emet(k) { var v = ((G.Emetteur || []).filter(function (p) { return p.cle === k; })[0] || {}).valeur || ""; return v === "À REMPLIR" ? "" : v; }
  function lireDocCourant() {
    var t = G_DOC.type, d = Object.assign({}, G_DOC.d);
    var map = { commune: "gd-commune", date: "gd-date", objet: "gd-objet", statut: "gd-statut", ref_points: "gd-points", taux_tva: "gd-tva", notes: "gd-notes", type: "gd-type", periode_debut: "gd-pdeb", periode_fin: "gd-pfin", ref_devis: "gd-devis", ref_chorus: "gd-chorus" };
    Object.keys(map).forEach(function (k) { if ($(map[k])) d[k] = gVal(map[k]); });
    var lignes = (G_DOC.lignes || []).filter(function (l) { return String(l.designation || "").trim() || Number(l.prix_unitaire_ht); });
    return { t: t, d: d, lignes: lignes };
  }
  function htmlDocument(x) {
    var t = x.t, d = x.d, cl = gClient(d.commune), tva = Number(String(d.taux_tva || emet("taux_tva") || 20).replace(",", ".")) || 0;
    var num = d.numero && d.numero.indexOf("BROUILLON") !== 0 ? d.numero : "Brouillon";
    var ht = 0, lignes = x.lignes.map(function (l) {
      var q = Number(String(l.quantite).replace(",", ".")) || 0, pu = Number(String(l.prix_unitaire_ht).replace(",", ".")) || 0, tl = q * pu; ht += tl;
      return '<tr><td>' + gEsc(l.designation || "") + (l.site_code ? '<div class="sub">Point ' + gEsc(l.site_code) + '</div>' : '') + (l.periode_debut ? '<div class="sub">Du ' + gDateFR(l.periode_debut) + ' au ' + gDateFR(l.periode_fin) + '</div>' : '') + '</td>'
        + '<td class="n">' + String(q).replace(".", ",") + '</td><td class="n">' + gEuros(pu) + '</td><td class="n">' + gEuros(tl) + '</td></tr>';
    }).join("");
    var mt = ht * tva / 100, ttc = ht + mt;
    var validite = d.validite || (function () { var n = Number(emet("validite_devis_jours")) || 30, z = new Date((d.date || new Date().toISOString().slice(0, 10)) + "T12:00:00"); z.setDate(z.getDate() + n); return z.toISOString().slice(0, 10); })();
    var echeance = d.echeance || (function () { var n = Number(emet("delai_paiement_jours")) || 30, z = new Date((d.date || new Date().toISOString().slice(0, 10)) + "T12:00:00"); z.setDate(z.getDate() + n); return z.toISOString().slice(0, 10); })();
    var adrE = [emet("adresse"), (emet("code_postal") + " " + emet("ville")).trim()].filter(Boolean).map(gEsc).join("<br>");
    var adrC = [cl.adresse_facturation, ((cl.code_postal || "") + " " + (cl.ville || "")).trim()].filter(Boolean).map(gEsc).join("<br>");
    var titre = t === "devis" ? "Devis" : "Facture";
    var manque = ["raison_sociale", "siret", "adresse", "iban"].filter(function (k) { return !emet(k); });
    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + titre + ' ' + gEsc(num) + ' — ' + gEsc(gNomCommune(d.commune)) + '</title><style>'
      + '@page{size:A4;margin:16mm 15mm 18mm}*{box-sizing:border-box}body{font:10.5pt/1.45 "Helvetica Neue",Arial,sans-serif;color:#1d2420;margin:0}'
      + '.barre{position:sticky;top:0;background:#1F3A2E;color:#fff;padding:10px 16px;display:flex;gap:10px;align-items:center;justify-content:center;font:600 14px system-ui}.barre button{border:0;border-radius:8px;padding:9px 16px;font:700 14px system-ui;cursor:pointer;background:#fff;color:#1F3A2E}'
      + '.page{max-width:180mm;margin:0 auto;padding:12mm 0}.alerte{background:#FDECEA;color:#8a1c14;border:1px solid #f2b8b5;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:9.5pt}'
      + '.haut{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.em b{font-size:13pt}.em,.cl{font-size:9.5pt;color:#333}'
      + '.titre{text-align:right}.titre h1{margin:0;font-size:24pt;letter-spacing:.04em;color:#1F3A2E;text-transform:uppercase}.titre .num{font-size:11pt;font-weight:700}.titre .dt{font-size:9.5pt;color:#555}'
      + '.blocs{display:flex;justify-content:space-between;gap:20px;margin:14mm 0 8mm}.cl{border:1px solid #cfd4cd;border-radius:6px;padding:10px 12px;min-width:85mm}.cl .lab,.lab{font-size:8pt;text-transform:uppercase;letter-spacing:.08em;color:#777;margin-bottom:3px}'
      + '.objet{margin:0 0 6mm;font-size:11pt}table{width:100%;border-collapse:collapse}th{background:#1F3A2E;color:#fff;font-size:8.5pt;text-transform:uppercase;letter-spacing:.05em;text-align:left;padding:7px 8px}'
      + 'td{padding:8px;border-bottom:1px solid #e4e1d8;vertical-align:top}.n{text-align:right;white-space:nowrap}.sub{font-size:8.5pt;color:#666}'
      + '.tot{margin-left:auto;width:75mm;margin-top:5mm}.tot div{display:flex;justify-content:space-between;padding:4px 8px}.tot .ttc{background:#1F3A2E;color:#fff;font-weight:700;font-size:12pt;border-radius:4px;margin-top:3px}'
      + '.mentions{margin-top:9mm;font-size:8.5pt;color:#444}.mentions p{margin:3px 0}.sign{display:flex;gap:20px;margin-top:10mm}.sign div{flex:1;border:1px solid #cfd4cd;border-radius:6px;height:32mm;padding:8px;font-size:9pt;color:#555}'
      + '.pied{margin-top:12mm;padding-top:6px;border-top:1px solid #cfd4cd;font-size:7.5pt;color:#777;text-align:center}'
      + '@media print{.barre{display:none}.page{padding:0;max-width:none}.alerte{display:none}}'
      + '@media screen and (max-width:720px){body{font-size:10pt}.page{max-width:none;padding:14px 12px 30px}.haut{flex-direction:column-reverse;gap:10px}.titre{text-align:left}.titre h1{font-size:20pt}'
      + '.blocs{margin:14px 0}.blocs>div:first-child{display:none}.cl{min-width:0;width:100%}'
      + 'th{font-size:7.5pt;padding:6px 4px}td{padding:7px 4px;font-size:9.5pt}td.n{font-size:9pt}.tot{width:100%}.sign{flex-direction:column}.sign div{height:22mm}}'
      + '</style></head><body><div class="barre">' + titre + ' ' + gEsc(num) + ' — <button type="button" onclick="window.print()">Imprimer / Enregistrer en PDF</button></div><div class="page">'
      + (manque.length ? '<div class="alerte">Émetteur incomplet (onglet Factures › Émetteur) : ' + manque.join(", ") + '. Le document n\'a pas de valeur tant que ces champs sont vides.</div>' : '')
      + (num === "Brouillon" ? '<div class="alerte">Brouillon : enregistrez le document pour obtenir son numéro.</div>' : '')
      + '<div class="haut"><div class="em"><b>' + gEsc(emet("raison_sociale") || "Raison sociale") + '</b>' + (emet("forme_juridique") ? ' <span>(' + gEsc(emet("forme_juridique")) + ')</span>' : '') + '<br>' + adrE
      + (emet("telephone") ? '<br>Tél. ' + gEsc(emet("telephone")) : '') + (emet("email") ? '<br>' + gEsc(emet("email")) : '') + (emet("siret") ? '<br>SIRET ' + gEsc(emet("siret")) : '') + (emet("tva_intracom") ? '<br>TVA ' + gEsc(emet("tva_intracom")) : '') + '</div>'
      + '<div class="titre"><h1>' + titre + '</h1><div class="num">N° ' + gEsc(num) + '</div><div class="dt">Date : ' + gDateFR(d.date) + (t === "devis" ? '<br>Valable jusqu\'au ' + gDateFR(validite) : '<br>Échéance : ' + gDateFR(echeance)) + '</div></div></div>'
      + '<div class="blocs"><div></div><div class="cl"><div class="lab">' + (t === "devis" ? "Destinataire" : "Facturé à") + '</div><b>' + gEsc(cl.nom_officiel || ("Mairie de " + gNomCommune(d.commune))) + '</b><br>' + adrC
      + (cl.siret ? '<br>SIRET ' + gEsc(cl.siret) : '') + (cl.code_service_chorus ? '<br>Code service Chorus : ' + gEsc(cl.code_service_chorus) : '') + '</div></div>'
      + (t === "devis" && d.objet ? '<p class="objet"><b>Objet :</b> ' + gEsc(d.objet) + '</p>' : '')
      + (t === "facture" ? '<p class="objet">' + (d.periode_debut ? '<b>Période :</b> du ' + gDateFR(d.periode_debut) + ' au ' + gDateFR(d.periode_fin) : '') + (d.ref_devis ? (d.periode_debut ? ' · ' : '') + '<b>Devis :</b> ' + gEsc(d.ref_devis) : '') + '</p>' : '')
      + '<table><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">Prix unit. HT</th><th class="n">Total HT</th></tr></thead><tbody>' + (lignes || '<tr><td colspan="4">Aucune ligne.</td></tr>') + '</tbody></table>'
      + '<div class="tot"><div><span>Total HT</span><b>' + gEuros(ht) + '</b></div>' + (tva ? '<div><span>TVA ' + String(tva).replace(".", ",") + ' %</span><b>' + gEuros(mt) + '</b></div>' : '') + '<div class="ttc"><span>Total TTC</span><span>' + gEuros(ttc) + '</span></div></div>'
      + '<div class="mentions">' + (!tva && emet("mention_tva") ? '<p>' + gEsc(emet("mention_tva")) + '</p>' : '')
      + (t === "devis"
        ? '<p>Devis valable jusqu\'au ' + gDateFR(validite) + '. Pour accepter, retourner ce devis daté et signé avec la mention « Bon pour accord ».</p>'
        : '<p>Paiement à ' + (Number(emet("delai_paiement_jours")) || 30) + ' jours, soit au plus tard le ' + gDateFR(echeance) + ', par virement (mandat administratif).</p>'
          + (emet("iban") ? '<p><b>IBAN</b> ' + gEsc(emet("iban")) + (emet("bic") ? ' · <b>BIC</b> ' + gEsc(emet("bic")) : '') + '</p>' : '')
          + '<p>En cas de retard de paiement : intérêts moratoires au taux légal applicable aux pouvoirs adjudicateurs et indemnité forfaitaire pour frais de recouvrement de 40 €.</p>'
          + (cl.code_service_chorus || cl.siret ? '<p>Facture déposée sur Chorus Pro' + (cl.siret ? ' (SIRET destinataire ' + gEsc(cl.siret) + (cl.code_service_chorus ? ', service ' + gEsc(cl.code_service_chorus) : '') + ')' : '') + '.</p>' : ''))
      + (emet("conditions") ? '<p>' + gEsc(emet("conditions")) + '</p>' : '') + (d.notes ? '<p>' + gEsc(d.notes) + '</p>' : '') + '</div>'
      + (t === "devis" ? '<div class="sign"><div>Pour ' + gEsc(emet("raison_sociale") || "l'émetteur") + '</div><div>Bon pour accord — date, nom, qualité et signature<br>Pour la commune de ' + gEsc(gNomCommune(d.commune)) + '</div></div>' : '')
      + '<div class="pied">' + gEsc([emet("raison_sociale"), emet("forme_juridique"), emet("siret") ? "SIRET " + emet("siret") : "", emet("tva_intracom") ? "TVA " + emet("tva_intracom") : ""].filter(Boolean).join(" · ")) + '</div>'
      + '</div></body></html>';
  }
  /* Aperçu dans la console (plein écran, sans nouvelle fenêtre : fiable aussi sur téléphone). */
  function montrerApercu(x) {
    var vieux = $("gd-apercu"); if (vieux) vieux.remove();
    var titre = (x.t === "devis" ? "Devis " : "Facture ") + (x.d.numero && x.d.numero.indexOf("BROUILLON") !== 0 ? x.d.numero : "(brouillon)");
    var f = document.createElement("div"); f.id = "gd-apercu";
    f.innerHTML = '<div class="gda-barre"><b>' + gEsc(titre) + ' — ' + gEsc(gNomCommune(x.d.commune)) + '</b><span><button type="button" id="gda-pdf">Imprimer / Enregistrer en PDF</button><button type="button" id="gda-x" aria-label="Fermer">✕</button></span></div><iframe id="gda-if" title="Aperçu du document"></iframe>';
    document.body.appendChild(f); document.body.style.overflow = "hidden";
    $("gda-if").srcdoc = htmlDocument(x).replace('<div class="barre">', '<div class="barre" style="display:none">');
    var fermer = function () { f.remove(); document.body.style.overflow = ""; };
    $("gda-x").onclick = fermer;
    $("gda-pdf").onclick = function () { try { var w = $("gda-if").contentWindow; w.focus(); w.print(); } catch (e) { msg("msg-doc", "Impression impossible : " + e.message, "ko"); } };
  }
  function apercuDoc() { if (G_DOC) montrerApercu(lireDocCourant()); }
  function apercuDepuisListe(type, numero) {
    var o = type === "devis" ? "Devis" : "Factures", d = (G[o] || []).filter(function (x) { return x.numero === numero; })[0]; if (!d) return;
    var lignes = (G.Lignes || []).filter(function (l) { return l.document === numero; }).sort(function (a, b) { return Number(a.num) - Number(b.num); });
    montrerApercu({ t: type, d: Object.assign({}, d), lignes: lignes });
  }
  // Bouton 📄 PDF à côté de chaque devis / facture des listes.
  function boutonsPdf() {
    ["g-devis-liste", "g-factures-liste", "g-fiche-docs"].forEach(function (id) {
      var box = $(id); if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll("a[data-gdoc]"), function (a) {
        if (a.nextElementSibling && a.nextElementSibling.classList.contains("gd-pdfb")) return;
        a.insertAdjacentHTML("afterend", ' <button type="button" class="gd-pdfb" data-gpdf="' + gEsc(a.dataset.gdoc) + '" data-num="' + gEsc(a.dataset.num) + '" title="Voir le PDF">📄 PDF</button>');
      });
    });
  }
  ["g-devis-liste", "g-factures-liste", "g-fiche-docs"].forEach(function (id) {
    var box = $(id); if (!box) return;
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-gpdf]"); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); apercuDepuisListe(b.dataset.gpdf, b.dataset.num); }, true);
    new MutationObserver(boutonsPdf).observe(box, { childList: true });
  });
  boutonsPdf();
  $("g-doc-pdf").addEventListener("click", apercuDoc);
  (function () { var st = document.createElement("style"); st.textContent =
    ".gd-ent,.gd-cols{display:grid;grid-template-columns:1fr 64px 1fr 96px 34px;gap:6px;align-items:center}.gd-ent{font-size:12px;color:var(--doux);margin:8px 0 -2px;padding:0 2px}"
    + ".gd-cols{margin-top:6px}.gd-cols input{margin:0}.gd-tl{text-align:right;font-variant-numeric:tabular-nums}"
    + "@media(max-width:480px){.gd-ent,.gd-cols{grid-template-columns:1fr 54px 1fr 80px 30px}}"
    + ".gfo-l{display:grid;grid-template-columns:30px 1fr auto;gap:6px 10px;align-items:center;margin-top:10px;padding:10px 12px;border:1px solid var(--trait);border-radius:12px;background:#fff}"
    + "#gf-proposition{font-size:16px!important;line-height:1.5}#gf-proposition>div{padding:5px 0;border-bottom:1px solid #EFEAE0}#gf-proposition b{font-size:17px;font-variant-numeric:tabular-nums;white-space:nowrap}"
    + "#gf-proposition>div:last-child{border-bottom:0;margin-top:8px;padding:10px 12px;background:#EEF5F0;border-radius:10px;font-size:17px}#gf-proposition>div:last-child b{font-size:20px;color:var(--vert)}"
    + ".gfo-lib b{display:block;font-size:15px}.gfo-base{display:block;font-size:13px;color:var(--doux);margin-top:1px}"
    + ".gfo-ch{grid-column:2 / -1;display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}.gfo-ch label{margin:0;font-size:12px;color:var(--doux);display:flex;flex-direction:column;gap:2px}"
    + ".gfo-ch small{font-size:11px;color:var(--doux)}.gfo-ch input{width:110px!important;height:42px;margin:0;font-size:16px}.gfo-x{padding-bottom:10px;color:var(--doux)}"
    + ".gfo-tot{padding-bottom:10px;font-weight:700;font-variant-numeric:tabular-nums}.gfo-sp{color:#C77700}"
    + ".gfo-c{width:26px!important;height:26px;margin:0;accent-color:var(--vert);cursor:pointer}.gfo-lib{margin:0;cursor:pointer;font-size:15px;line-height:1.35}"

    + ".gfo-off{margin:0;cursor:pointer;display:inline-flex}.gfo-off input{position:absolute;opacity:0;width:1px;height:1px}"
    + ".gfo-off span{display:inline-block;border:1px solid var(--trait);border-radius:999px;padding:9px 14px;font:600 14px system-ui;color:var(--vert);background:#fff;white-space:nowrap}"
    + ".gfo-off input:disabled+span{opacity:.45;border-style:dashed;cursor:not-allowed}.gfo-aide{grid-column:1 / -1;font-size:13px;color:#8a5a00;background:#FFF4DF;border-radius:8px;padding:6px 10px}"
    + ".gfo-off input:checked+span{background:var(--ok);border-color:var(--ok);color:#fff}.gfo-off input:focus-visible+span{outline:2px solid var(--accent)}"
    + "@media(max-width:480px){.gfo-l{grid-template-columns:30px 1fr}.gfo-off{grid-column:2 / -1;justify-self:start}.gfo-ch input{width:92px!important}}"
    + "#gd-apercu{position:fixed;inset:0;z-index:120;background:#3b423e;display:flex;flex-direction:column}"
    + ".gda-barre{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#1F3A2E;color:#fff;font-size:15px}.gda-barre span{display:flex;gap:8px}"
    + ".gda-barre button{border:0;border-radius:9px;padding:10px 14px;font:700 15px system-ui;cursor:pointer;background:#fff;color:#1F3A2E}#gda-x{background:transparent;color:#fff;font-size:20px;padding:6px 12px}"
    + "#gda-if{flex:1;border:0;background:#fff;width:100%;max-width:900px;margin:0 auto}"
    + ".gd-pdfb{border:1px solid var(--trait);background:#fff;border-radius:7px;padding:2px 8px;font:600 12px system-ui;cursor:pointer;margin-left:4px;vertical-align:middle}.gd-pdfb:hover{background:#EEF5F0}";
    document.head.appendChild(st); })();

  /* Éditeur de document : lignes du catalogue, remise commerciale, option offerte (parrainage). */
  $("g-doc-ligne").insertAdjacentHTML("afterend", '<div class="gd-outils" id="gd-outils">'
    + '<select id="gd-cat" aria-label="Ajouter une ligne du catalogue"><option value="">+ Ligne du catalogue…</option></select>'
    + '<button type="button" class="second" id="gd-remise">+ Remise %</button>'
    + '<button type="button" class="second" id="gd-offert">+ Option offerte (parrainage)</button></div>');
  function catalogue() { return (G.Tarifs || []).filter(function (t) { return t.categorie !== "tranche" && t.actif !== "non"; }).sort(function (a, b) { return (Number(a.ordre) || 0) - (Number(b.ordre) || 0); }); }
  function libUnite(u) { return ({ point_an: "par point et par an", point_mois: "par point et par mois", forfait_an: "forfait annuel", forfait_mois: "forfait mensuel", forfait: "forfait", unite: "l'unité" })[u] || (u || ""); }
  function remplirCatalogue() {
    var s = $("gd-cat"); if (!s) return;
    s.innerHTML = '<option value="">+ Ligne du catalogue…</option>' + catalogue().map(function (t) { return '<option value="' + gEsc(t.code) + '">' + gEsc(t.libelle) + ' — ' + gEuros(t.prix_ht) + ' HT ' + gEsc(libUnite(t.unite)) + '</option>'; }).join("");
    $("gd-outils").hidden = !!(G_DOC && G_DOC.verrou);
  }
  function lireLignesSaisies() {
    Array.prototype.forEach.call($("g-doc-lignes").querySelectorAll(".g-ligne"), function (r) {
      var l = G_DOC.lignes[Number(r.dataset.i)]; if (!l) return;
      Array.prototype.forEach.call(r.querySelectorAll("[data-k]"), function (e) { l[e.dataset.k] = e.value; });
    });
  }
  function totalLignesHT() { return G_DOC.lignes.reduce(function (s, l) { return s + (Number(String(l.quantite).replace(",", ".")) || 0) * (Number(String(l.prix_unitaire_ht).replace(",", ".")) || 0); }, 0); }
  $("gd-cat").addEventListener("change", function () {
    var t = catalogue().filter(function (x) { return x.code === $("gd-cat").value; })[0]; $("gd-cat").value = ""; if (!t || !G_DOC) return;
    lireLignesSaisies();
    G_DOC.lignes = G_DOC.lignes.filter(function (l) { return String(l.designation || "").trim() || Number(l.prix_unitaire_ht); });
    var q = /^point/.test(t.unite) ? (Number(gPotentiel(gVal("gd-commune")).points) || 1) : 1;
    G_DOC.lignes.push({ designation: t.libelle + (t.unite ? " (" + libUnite(t.unite) + ")" : ""), site_code: "", quantite: q, prix_unitaire_ht: t.prix_ht });
    dessinerLignes();
  });
  $("gd-remise").addEventListener("click", function () {
    if (!G_DOC) return; lireLignesSaisies();
    var base = G_DOC.lignes.filter(function (l) { return Number(String(l.prix_unitaire_ht).replace(",", ".")) > 0; }).reduce(function (s, l) { return s + (Number(String(l.quantite).replace(",", ".")) || 0) * Number(String(l.prix_unitaire_ht).replace(",", ".")); }, 0);
    var p = prompt("Remise commerciale en % (sur " + gEuros(base) + " HT) :", "10"); if (p === null) return;
    p = Number(String(p).replace(",", ".")); if (!(p > 0 && p <= 100)) { msg("msg-doc", "Remise invalide.", "ko"); return; }
    G_DOC.lignes.push({ designation: "Remise commerciale " + String(p).replace(".", ",") + " %", site_code: "", quantite: 1, prix_unitaire_ht: -Math.round(base * p) / 100 });
    dessinerLignes();
  });
  $("gd-offert").addEventListener("click", function () {
    if (!G_DOC) return; lireLignesSaisies();
    var opts = catalogue().filter(function (t) { return t.categorie === "option"; });
    if (!opts.length) { msg("msg-doc", "Aucune option dans le catalogue (onglet Tarifs).", "ko"); return; }
    var choix = prompt("Option offerte au titre du parrainage — numéro :\n" + opts.map(function (t, i) { return (i + 1) + ". " + t.libelle + " (" + gEuros(t.prix_ht) + " HT)"; }).join("\n"), "1");
    var t = opts[Number(choix) - 1]; if (!t) return;
    G_DOC.lignes.push({ designation: t.libelle + (t.unite ? " (" + libUnite(t.unite) + ")" : ""), site_code: "", quantite: 1, prix_unitaire_ht: t.prix_ht });
    G_DOC.lignes.push({ designation: "Offert au titre du parrainage : " + t.libelle, site_code: "", quantite: 1, prix_unitaire_ht: -Number(t.prix_ht) || 0 });
    dessinerLignes();
  });
  (function () { var o = ouvrirDoc; ouvrirDoc = function () { var r = o.apply(this, arguments); remplirCatalogue(); return r; }; })();
  (function () { var st = document.createElement("style"); st.textContent = ".gd-outils{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.gd-outils select{flex:2;min-width:200px;margin:0}.gd-outils button{flex:1;min-width:120px}"; document.head.appendChild(st); })();

  /* Devis / facture ouvert depuis la fiche client : « Fermer » ramène à la fiche (sous-onglet Devis & factures). */
  var GD_ORIGINE = null;
  $("g-fiche-docs").addEventListener("click", function (e) { if (e.target.closest("[data-gdoc],[data-gfacturer]")) GD_ORIGINE = $("g-commune").value; }, true);
  if ($("gfd-nouveau")) $("gfd-nouveau").addEventListener("click", function () { GD_ORIGINE = $("g-commune").value; }, true);
  $("g-doc-fermer").addEventListener("click", function () {
    if (!GD_ORIGINE) return;
    var com = GD_ORIGINE; GD_ORIGINE = null;
    var nb = document.querySelector('nav button[data-onglet="clients"]'); if (nb) nb.click();
    setTimeout(function () {
      if ($("g-commune").value !== com) { $("g-commune").value = com; dessinerFiche(); }
      GF_PANE = "docs"; gfAppliquerPane();
      var t = $("gf-titre"); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  });
  // Changer d'onglet à la main annule le retour automatique.
  document.querySelector("nav").addEventListener("click", function (e) { var b = e.target.closest("button[data-onglet]"); if (b && b.dataset.onglet !== "factu") GD_ORIGINE = null; }, true);

  /* « Offerte » grisée : un appui explique ce qui manque (option non cochée ou aucun parrain choisi). */
  $("g-fiche").addEventListener("click", function (e) {
    var lab = e.target.closest(".gfo-off"); if (!lab) return;
    var i = lab.querySelector("input[data-offert]"); if (!i || !i.disabled) return;
    e.preventDefault();
    var ligne = lab.closest(".gfo-l"), opt = ligne && ligne.querySelector("input[data-opt]");
    var vieux = ligne.querySelector(".gfo-aide"); if (vieux) vieux.remove();
    ligne.insertAdjacentHTML("beforeend", '<div class="gfo-aide">' + (opt && !opt.checked ? "Cochez d'abord l'option (case à gauche)." : "Pour offrir une option, choisissez d'abord la commune marraine dans « Parrainage » ci-dessous.") + '</div>');
    setTimeout(function () { var a = ligne.querySelector(".gfo-aide"); if (a) a.remove(); }, 5000);
  });


  /* — Assistant de dépôt Chorus Pro (dépôt manuel guidé, sans API PISTE) —
     Vérifie la facture, prépare le PDF et les données à recopier, puis passe la facture
     au statut « Déposée sur Chorus Pro » avec sa référence. */
  var GCH_PORTAIL = "https://portail.chorus-pro.gouv.fr/";
  function gchSiretOk(s) {
    s = String(s || "").replace(/\s/g, ""); if (!/^\d{14}$/.test(s)) return false;
    var t = 0; for (var i = 0; i < 14; i++) { var n = Number(s[13 - i]); if (i % 2) { n *= 2; if (n > 9) n -= 9; } t += n; }
    return t % 10 === 0 || /^356000000/.test(s); // exception La Poste
  }
  function gchNombre(n) { return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ","); }
  function gchCopier(txt, b) {
    var fini = function () { if (!b) return; var a = b.textContent; b.textContent = "Copié ✓"; b.classList.add("ok"); setTimeout(function () { b.textContent = a; b.classList.remove("ok"); }, 1400); };
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(txt).then(fini, function () { gchCopierVieux(txt); fini(); }); }
    else { gchCopierVieux(txt); fini(); }
  }
  function gchCopierVieux(txt) { var z = document.createElement("textarea"); z.value = txt; z.style.position = "fixed"; z.style.opacity = "0"; document.body.appendChild(z); z.select(); try { document.execCommand("copy"); } catch (e) {} z.remove(); }
  function gchFacture(numero) {
    var f = (G.Factures || []).filter(function (x) { return x.numero === numero; })[0]; if (!f) return null;
    var lignes = (G.Lignes || []).filter(function (l) { return l.document === numero; }).sort(function (a, b) { return Number(a.num) - Number(b.num); });
    var ht = lignes.reduce(function (s, l) { return s + (Number(String(l.quantite).replace(",", ".")) || 0) * (Number(String(l.prix_unitaire_ht).replace(",", ".")) || 0); }, 0);
    var tva = Number(String(f.taux_tva || emet("taux_tva") || 20).replace(",", ".")) || 0;
    if (f.total_ht !== undefined && f.total_ht !== "") ht = Number(String(f.total_ht).replace(",", ".")) || ht;
    return { f: f, lignes: lignes, ht: ht, tva: tva, mt: ht * tva / 100, ttc: ht * (1 + tva / 100) };
  }
  function ouvrirChorus(numero) {
    var x = gchFacture(numero); if (!x) return;
    var f = x.f, cl = gClient(f.commune), nomC = gNomCommune(f.commune);
    var definitif = f.numero && f.numero.indexOf("BROUILLON") !== 0 && f.statut !== "brouillon";
    var manqueE = ["raison_sociale", "siret", "adresse", "iban"].filter(function (k) { return !emet(k); });
    var siretC = String(cl.siret || "").replace(/\s/g, "");
    var fichier = ("Facture-" + f.numero + "-" + nomC).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/-+/g, "-") + ".pdf";
    var ctrl = [
      [definitif ? "ok" : "ko", "Facture émise", definitif ? "N° " + f.numero : "Passez d'abord la facture au statut « Émise » pour qu'elle ait son numéro définitif."],
      [manqueE.length ? "ko" : "ok", "Émetteur complet", manqueE.length ? "À compléter (onglet Factures › Émetteur) : " + manqueE.join(", ") + "." : emet("raison_sociale") + " · SIRET " + emet("siret")],
      [!siretC ? "ko" : gchSiretOk(siretC) ? "ok" : "ko", "SIRET de la mairie", !siretC ? "Manquant dans la fiche client : Chorus en a besoin pour trouver le destinataire." : gchSiretOk(siretC) ? siretC : siretC + " ne semble pas valide (14 chiffres, clé de contrôle)."],
      [cl.code_service_chorus ? "ok" : "info", "Code service", cl.code_service_chorus ? cl.code_service_chorus : "Aucun. Laissez le champ vide, sauf si Chorus le rend obligatoire pour cette mairie."],
      [x.lignes.length && x.ttc > 0 ? "ok" : "ko", "Montant", x.lignes.length ? gEuros(x.ttc) + " TTC (" + x.lignes.length + " ligne" + (x.lignes.length > 1 ? "s" : "") + ")" : "La facture n'a aucune ligne."]
    ];
    if (f.statut === "deposee_chorus" || f.ref_chorus) ctrl.push(["info", "Déjà déposée ?", f.ref_chorus ? "Référence Chorus déjà notée : " + f.ref_chorus + ". Ne la déposez pas deux fois." : "Le statut indique un dépôt déjà fait. Ne la déposez pas deux fois."]);
    var bloquant = ctrl.some(function (c) { return c[0] === "ko"; });
    var icone = { ok: "✅", ko: "❌", info: "ℹ️" };
    var copie = function (lib, val, aide) {
      return '<div class="gch-c"><div><span>' + gEsc(lib) + '</span><b>' + (val ? gEsc(val) : '<i>vide</i>') + '</b>' + (aide ? '<small>' + gEsc(aide) + '</small>' : '') + '</div>'
        + (val ? '<button type="button" class="second" data-gch-copie="' + gEsc(val) + '">Copier</button>' : '<span></span>') + '</div>';
    };
    var etape = function (n, titre, corps) { return '<div class="gch-e"><h3><span>' + n + '</span>' + titre + '</h3>' + corps + '</div>'; };
    var h = '<div class="gch-barre"><b>Dépôt Chorus Pro — Facture ' + gEsc(definitif ? f.numero : "(brouillon)") + ' · ' + gEsc(nomC) + '</b><button type="button" id="gch-x" aria-label="Fermer">✕</button></div><div class="gch-corps">'
      + etape(1, "Vérifications", '<ul class="gch-ctrl">' + ctrl.map(function (c) { return '<li class="' + c[0] + '"><span>' + icone[c[0]] + '</span><div><b>' + gEsc(c[1]) + '</b><br>' + gEsc(c[2]) + '</div></li>'; }).join("") + '</ul>'
        + (bloquant ? '<div class="gch-stop">Corrigez les points ❌ avant de déposer : une facture incomplète est rejetée par Chorus.' + (!siretC || !gchSiretOk(siretC) ? ' <button type="button" class="second" id="gch-fiche">Ouvrir la fiche de ' + gEsc(nomC) + '</button>' : '') + '</div>' : ''))
      + etape(2, "Enregistrer le PDF", '<p>Ouvrez l\'aperçu puis « Imprimer / Enregistrer en PDF » (destination : <b>Enregistrer au format PDF</b>). Un seul fichier par facture, sans mot de passe.</p>'
        + (f.pdf_drive ? '<a class="gch-lien" href="' + gEsc(gDrive(f.pdf_drive)) + '" target="_blank" rel="noopener" style="margin-bottom:8px">☁️ PDF archivé sur Drive (à télécharger puis déposer)</a>' : '') + copie("Nom de fichier conseillé", fichier) + '<button type="button" class="' + (f.pdf_drive ? 'second' : 'principal') + '" id="gch-pdf">📄 ' + (f.pdf_drive ? "Ou recréer le PDF depuis la console" : "Ouvrir le PDF de la facture") + '</button>')
      + etape(3, "Ouvrir Chorus Pro", '<p>Connectez-vous, puis <b>Facturation › Factures émises › Déposer facture</b>. Choisissez le dépôt d\'un fichier <b>PDF</b> et importez le fichier enregistré.</p>'
        + '<a class="gch-lien" href="' + GCH_PORTAIL + '" target="_blank" rel="noopener">🏛 Ouvrir le portail Chorus Pro ↗</a>')
      + etape(4, "Compléter les blocs", '<p>Chorus lit le PDF et pré-remplit une partie des champs. Vérifiez chaque bloc avec les valeurs ci-dessous.</p>'
        + '<h4>Cadre de facturation</h4>' + copie("Cadre", "A1", "A1 = dépôt d'une facture par un fournisseur (cas général)")
        + '<h4>Destinataire</h4>' + copie("SIRET de la mairie", siretC) + copie("Code service", cl.code_service_chorus || "", cl.code_service_chorus ? "" : "laisser vide s'il n'est pas demandé")
        + '<h4>Identification</h4>' + copie("Type", "Facture") + copie("Numéro de facture", definitif ? f.numero : "") + copie("Date de facture", gDateFR(f.date))
        + '<h4>Références</h4>' + copie("Numéro d'engagement", "", "si la mairie vous a donné un bon de commande ou un n° d'engagement, saisissez-le ; sinon laissez vide")
        + copie("Mode de paiement", "Virement") + copie("Devise", "EUR")
        + '<h4>Montants</h4>' + copie("Total HT", gchNombre(x.ht)) + copie("TVA " + String(x.tva).replace(".", ",") + " %", gchNombre(x.mt)) + copie("Total TTC", gchNombre(x.ttc))
        + '<h4>Fournisseur (vous)</h4>' + copie("Votre SIRET", emet("siret")) + copie("IBAN", emet("iban"), "il doit être celui déclaré dans votre compte Chorus Pro"))
      + etape(5, "Soumettre et noter la référence", '<p>Cliquez sur <b>Valider et envoyer</b> dans Chorus. Recopiez ensuite le <b>numéro de flux</b> ou le numéro attribué par Chorus : il sert à suivre le traitement et le paiement.</p>'
        + '<label for="gch-ref"><b>Référence Chorus Pro</b></label><input id="gch-ref" value="' + gEsc(f.ref_chorus || "") + '" placeholder="ex. CPP2026_123456789" autocomplete="off">'
        + '<button type="button" class="principal" id="gch-ok"' + (definitif ? '' : ' disabled') + '>' + (f.statut === "payee" ? "Enregistrer la référence" : "Marquer la facture comme déposée") + '</button><div class="msg" id="msg-gch"></div>'
        + '<p class="petit">Le suivi se fait ensuite dans Chorus (Factures émises › Consulter). La facture garde son échéance du ' + gDateFR(f.echeance) + ' dans l\'agenda.</p>')
      + '</div>';
    var vieux = $("gch"); if (vieux) vieux.remove();
    var o = document.createElement("div"); o.id = "gch"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Assistant de dépôt Chorus Pro"); o.innerHTML = h;
    document.body.appendChild(o); document.body.style.overflow = "hidden";
    var fermer = function () { o.remove(); document.body.style.overflow = ""; };
    $("gch-x").onclick = fermer;
    o.addEventListener("click", function (e) { var b = e.target.closest("[data-gch-copie]"); if (b) gchCopier(b.dataset.gchCopie, b); });
    $("gch-pdf").onclick = function () {
      var t0 = document.title; document.title = fichier.replace(/\.pdf$/, "");
      montrerApercu({ t: "facture", d: Object.assign({}, f), lignes: x.lignes });
      var ap = $("gd-apercu"); if (ap) { ap.style.zIndex = 130; new MutationObserver(function (m, obs) { if (!document.body.contains(ap)) { document.title = t0; document.body.style.overflow = "hidden"; obs.disconnect(); } }).observe(document.body, { childList: true }); }
    };
    if ($("gch-fiche")) $("gch-fiche").onclick = function () {
      fermer(); if ($("g-doc")) $("g-doc").hidden = true;
      var nb = document.querySelector('nav button[data-onglet="clients"]'); if (nb) nb.click();
      setTimeout(function () { $("g-commune").value = f.commune; dessinerFiche(); var s = $("gf-siret"); if (s) { s.scrollIntoView({ behavior: "smooth", block: "center" }); s.focus(); } }, 40);
    };
    $("gch-ok").onclick = function () {
      var ref = gVal("gch-ref");
      if (!ref && !confirm("Aucune référence Chorus saisie. Marquer quand même la facture comme déposée ?")) return;
      var e = { numero: f.numero };
      ["commune", "date", "type", "periode_debut", "periode_fin", "ref_devis", "statut", "payee_le", "taux_tva", "notes"].forEach(function (k) { if (f[k] !== undefined) e[k] = f[k]; });
      e.ref_chorus = ref; if (f.statut !== "payee") e.statut = "deposee_chorus";
      $("gch-ok").disabled = true;
      gEnvoyer({ op: "document", type: "facture", entete: e }, "msg-gch", "Facture notée « Déposée sur Chorus Pro »" + (ref ? " (" + ref + ")" : "") + ".")
        .then(function () { if (G_DOC && G_DOC.type === "facture" && G_DOC.d.numero === f.numero) ouvrirDoc("facture", f.numero); setTimeout(fermer, 1300); })
        .catch(function () { $("gch-ok").disabled = false; });
    };
  }
  // Bouton dans l'éditeur (factures émises seulement).
  $("g-doc-pdf").insertAdjacentHTML("afterend", '<button class="second" id="g-doc-chorus" type="button" style="flex:1" hidden>🏛 Déposer sur Chorus</button>');
  $("g-doc-chorus").addEventListener("click", function () { if (G_DOC && G_DOC.d.numero) ouvrirChorus(G_DOC.d.numero); });
  (function () { var o = ouvrirDoc; ouvrirDoc = function () { var r = o.apply(this, arguments); var d = G_DOC && G_DOC.d;
    $("g-doc-chorus").hidden = !(G_DOC && G_DOC.type === "facture" && d.numero && d.statut !== "annulee");
    if (!$("g-doc-chorus").hidden) $("g-doc-chorus").textContent = d.statut === "emise" ? "🏛 Déposer sur Chorus" : d.statut === "brouillon" ? "🏛 Chorus Pro (après émission)" : "🏛 Chorus Pro"; return r; }; })();
  // Bouton 🏛 dans les listes, pour les factures émises pas encore déposées.
  function boutonsChorus() {
    ["g-factures-liste", "g-fiche-docs"].forEach(function (id) {
      var box = $(id); if (!box || !G) return;
      Array.prototype.forEach.call(box.querySelectorAll('a[data-gdoc="facture"]'), function (a) {
        var f = (G.Factures || []).filter(function (x) { return x.numero === a.dataset.num; })[0];
        var apres = a.nextElementSibling && a.nextElementSibling.classList.contains("gd-pdfb") ? a.nextElementSibling : a;
        if (!f || f.statut !== "emise" || (apres.nextElementSibling && apres.nextElementSibling.classList.contains("gch-b"))) return;
        apres.insertAdjacentHTML("afterend", ' <button type="button" class="gd-pdfb gch-b" data-gch="' + gEsc(f.numero) + '" title="Assistant de dépôt Chorus Pro">🏛 Chorus</button>');
      });
    });
  }
  ["g-factures-liste", "g-fiche-docs"].forEach(function (id) {
    var box = $(id); if (!box) return;
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-gch]"); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); ouvrirChorus(b.dataset.gch); }, true);
    new MutationObserver(function () { setTimeout(boutonsChorus, 0); }).observe(box, { childList: true });
  });
  (function () { var st = document.createElement("style"); st.textContent =
    "#gch{position:fixed;inset:0;z-index:125;background:#F4F1EA;display:flex;flex-direction:column}"
    + ".gch-barre{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#1F3A2E;color:#fff;font-size:15px}#gch-x{border:0;background:transparent;color:#fff;font-size:20px;padding:6px 12px;cursor:pointer}"
    + ".gch-corps{flex:1;overflow:auto;padding:14px;max-width:760px;width:100%;margin:0 auto;box-sizing:border-box}"
    + ".gch-e{background:#fff;border:1px solid var(--trait);border-radius:14px;padding:14px 16px;margin-bottom:12px}.gch-e h3{margin:0 0 8px;font-size:17px;display:flex;align-items:center;gap:10px}"
    + ".gch-e h3 span{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#1F3A2E;color:#fff;font-size:14px}.gch-e h4{margin:12px 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--doux)}.gch-e p{margin:4px 0 10px;font-size:15px;line-height:1.45}"
    + ".gch-ctrl{list-style:none;margin:0;padding:0}.gch-ctrl li{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #EFEAE0;font-size:14.5px}.gch-ctrl li:last-child{border-bottom:0}.gch-ctrl li.ko{color:#8a1c14}"
    + ".gch-stop{margin-top:8px;padding:10px 12px;border-radius:10px;background:#FDECEA;color:#8a1c14;font-size:14px}.gch-stop button{margin-top:8px}"
    + ".gch-c{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px dashed #EFEAE0}.gch-c div{min-width:0}.gch-c span{display:block;font-size:12.5px;color:var(--doux)}"
    + ".gch-c b{display:block;font-size:16px;word-break:break-all;font-variant-numeric:tabular-nums}.gch-c i{color:var(--doux);font-weight:400}.gch-c small{display:block;font-size:12px;color:var(--doux)}.gch-c button{padding:6px 12px;font-size:13px;white-space:nowrap;margin:0}.gch-c button.ok{background:var(--ok);color:#fff;border-color:var(--ok)}"
    + ".gch-lien{display:block;text-align:center;padding:13px;border-radius:12px;background:#1F3A2E;color:#fff;font-weight:700;text-decoration:none;font-size:16px}"
    + "#gch .principal{width:100%;margin-top:8px}#gch-ref{font-size:16px}.gch-b{color:#5B3A87}";
    document.head.appendChild(st); })();


  /* — Du devis à la facture : une facture se crée depuis son devis accepté (lignes, TVA et lien repris). — */
  function gdFactureDuDevis(n) { return (G && G.Factures || []).filter(function (f) { return f.ref_devis === n && f.statut !== "annulee"; })[0] || null; }
  function gdLignesDevis(n) {
    return (G.Lignes || []).filter(function (l) { return l.document === n; }).sort(function (a, b) { return Number(a.num) - Number(b.num); })
      .map(function (l) { return { designation: l.designation, site_code: l.site_code, quantite: l.quantite, prix_unitaire_ht: l.prix_unitaire_ht, periode_debut: l.periode_debut, periode_fin: l.periode_fin }; });
  }
  function factureDepuisDevis(n, idMsg) {
    var d = (G.Devis || []).filter(function (x) { return x.numero === n; })[0]; if (!d) return;
    var deja = gdFactureDuDevis(n);
    if (deja && !confirm("Ce devis a déjà la facture " + deja.numero + ". En créer une autre ?")) return;
    if (d.statut !== "accepte" && !confirm("Ce devis n'est pas marqué « Accepté ». Créer quand même la facture ?")) return;
    var lignes = gdLignesDevis(n); if (!lignes.length) { msg(idMsg, "Le devis " + n + " n'a aucune ligne.", "ko"); return; }
    var auj = new Date().toISOString().slice(0, 10), fin = new Date(auj + "T12:00:00"); fin.setFullYear(fin.getFullYear() + 1); fin.setDate(fin.getDate() - 1);
    var e = { numero: "", commune: d.commune, date: auj, type: "forfait", periode_debut: auj, periode_fin: fin.toISOString().slice(0, 10), ref_devis: n, statut: "brouillon", taux_tva: d.taux_tva || "", notes: d.objet ? "Objet : " + d.objet : "" };
    gEnvoyer({ op: "document", type: "facture", entete: e, lignes: lignes }, idMsg, "Facture préparée depuis le devis " + n + ".").then(function (j) {
      var num = j.document && j.document.numero; if (!num) return;
      var nf = document.querySelector('nav button[data-onglet="factu"]'); if (nf) nf.click();
      ouvrirDoc("facture", num);
      msg("msg-doc", "Facture préparée depuis le devis " + n + " (lignes et TVA reprises). Vérifiez la période, puis passez le statut à « Émise » et enregistrez.", "info");
    }).catch(function () {});
  }
  $("g-fiche-docs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gfacturer]"); if (!b) return; e.preventDefault(); e.stopImmediatePropagation();
    GD_ORIGINE = $("g-commune").value; factureDepuisDevis(b.dataset.gfacturer, "msg-fiche-docs");
  }, true);
  // Dans l'éditeur de devis : bouton « Créer la facture » quand le devis enregistré est accepté.
  $("g-doc-pdf").insertAdjacentHTML("afterend", '<button class="principal" id="g-doc-facturer" type="button" style="flex:1;margin-top:0" hidden>🧾 Créer la facture</button>');
  $("g-doc-facturer").addEventListener("click", function () { if (G_DOC && G_DOC.d.numero) factureDepuisDevis(G_DOC.d.numero, "msg-doc"); });
  // Dans l'éditeur de facture : choisir le devis d'origine reprend ses lignes et sa TVA.
  function gdBrancherDevis() {
    var s = $("gd-devis"); if (!s || !G_DOC || G_DOC.type !== "facture" || G_DOC.verrou) return;
    var remplir = function () {
      var com = gVal("gd-commune"), cur = s.value;
      s.innerHTML = '<option value="">— aucun —</option>' + (G.Devis || []).filter(function (x) { return x.commune === com && String(x.numero).indexOf("BROUILLON") !== 0; })
        .map(function (x) { return '<option value="' + gEsc(x.numero) + '"' + (x.numero === cur ? " selected" : "") + '>' + gEsc(x.numero + " — " + gLib(G_ST_DEVIS, x.statut) + " — " + gEuros(x.total_ht) + " HT") + '</option>'; }).join("");
    };
    remplir();
    if ($("gd-commune")) $("gd-commune").addEventListener("change", remplir);
    s.addEventListener("change", function () {
      var n = s.value; if (!n) return;
      var lignes = gdLignesDevis(n); if (!lignes.length) return;
      lireLignesSaisies();
      var utiles = G_DOC.lignes.filter(function (l) { return String(l.designation || "").trim() || Number(l.prix_unitaire_ht); });
      if (utiles.length && !confirm("Remplacer les " + utiles.length + " ligne(s) de la facture par celles du devis " + n + " ?")) return;
      G_DOC.lignes = lignes;
      var d = (G.Devis || []).filter(function (x) { return x.numero === n; })[0];
      if (d && d.taux_tva && $("gd-tva")) $("gd-tva").value = d.taux_tva;
      dessinerLignes(); msg("msg-doc", "Lignes reprises du devis " + n + ". Enregistrez pour les garder.", "info");
    });
  }
  (function () { var o = ouvrirDoc; ouvrirDoc = function () { var r = o.apply(this, arguments);
    var d = G_DOC && G_DOC.d;
    $("g-doc-facturer").hidden = !(G_DOC && G_DOC.type === "devis" && d.numero && d.statut === "accepte");
    if (!$("g-doc-facturer").hidden && gdFactureDuDevis(d.numero)) $("g-doc-facturer").textContent = "🧾 Facture " + gdFactureDuDevis(d.numero).numero;
    else $("g-doc-facturer").textContent = "🧾 Créer la facture";
    gdBrancherDevis(); return r; }; })();
  $("g-doc-facturer").addEventListener("click", function (e) {
    var f = G_DOC && gdFactureDuDevis(G_DOC.d.numero); if (!f) return; e.stopImmediatePropagation(); ouvrirDoc("facture", f.numero);
  }, true);
  (function () { var st = document.createElement("style"); st.textContent =
    "#g-fiche-docs{font-size:15px}.gdf-resume{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}.gdf-resume div{background:#F4F1EA;border-radius:12px;padding:8px 10px}"
    + ".gdf-resume span{display:block;font-size:12px;color:var(--doux)}.gdf-resume b{font-size:17px;font-variant-numeric:tabular-nums}.gdf-resume .du b{color:var(--ko)}"
    + ".gdf-etapes{display:flex;list-style:none;margin:0 0 10px;padding:0;gap:4px;font-size:12px;color:var(--doux);counter-reset:e}.gdf-etapes li{flex:1;text-align:center;padding:5px 2px;border-radius:8px;background:#EEF5F0;counter-increment:e}.gdf-etapes li:before{content:counter(e) '. ';font-weight:700}"
    + ".gdf-alerte{background:#FFF4DF;color:#8a5a00;border-radius:10px;padding:8px 12px;margin-bottom:10px;font-weight:600}"
    + ".gdf-t{display:flex;align-items:center;gap:8px;margin:14px 0 8px;font-size:16px}.gdf-t span{background:#EEF5F0;border-radius:999px;padding:1px 9px;font-size:13px}"
    + ".gdf-c{border:1px solid var(--trait);border-radius:14px;padding:12px 14px;margin-bottom:10px;background:#fff}.gdf-c.retard{border-color:#f2b8b5;background:#FFF8F7}"
    + ".gdf-h{display:flex;justify-content:space-between;align-items:center;gap:8px}.gdf-h b{font-size:16px}.gdf-o{margin-top:4px;color:#333}.gdf-o small,.gdf-m small{color:var(--doux);font-size:13px}.gdf-m small.ko{color:var(--ko);font-weight:600}"
    + ".gdf-m{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-top:6px}.gdf-m>b{font-size:19px;white-space:nowrap;font-variant-numeric:tabular-nums}.gdf-m>b small{font-size:12px;color:var(--doux);font-weight:400}"
    + ".gdf-lien{margin-top:8px;padding:6px 10px;border-radius:8px;background:#EEF5F0}"
    + ".gdf-a{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.gdf-a button{flex:1 1 auto;min-height:42px;margin:0;padding:8px 12px;font-size:14px;border-radius:10px}.gdf-a .gd-pdfb{font:inherit;font-size:14px;margin:0}.gdf-a .gdf-sup{color:var(--ko);flex:0 1 auto}"
    + ".gdf-vide{color:var(--doux);font-style:italic}.gdf-lnk{border:0;background:none;padding:0;margin:0 4px 0 0;font:inherit;font-weight:700;color:var(--vert);text-decoration:underline;cursor:pointer}"
    + "@media(max-width:480px){.gdf-resume b{font-size:15px}.gdf-a button{flex:1 1 40%}.gdf-a .principal{flex:1 1 100%}}";
    document.head.appendChild(st); })();


  /* « Nouvelle facture » dans la fiche : part du devis accepté de la commune (choix s'il y en a plusieurs), sinon facture vierge. */
  (function () {
    var b0 = $("gfd-nouveau"); if (!b0) return;
    b0.insertAdjacentHTML("afterend", '<button class="second" id="gfd-facture" type="button" style="float:right;padding:4px 10px;font-size:13px;margin-right:6px">Nouvelle facture</button>');
    document.addEventListener("click", function (ev) {
      if (!ev.target.closest("#gfd-facture")) return;
      var com = $("g-commune").value; if (!com) return;
      GD_ORIGINE = com;
      var acc = (G.Devis || []).filter(function (d) { return d.commune === com && d.statut === "accepte" && !gdFactureDuDevis(d.numero); });
      if (acc.length === 1) { factureDepuisDevis(acc[0].numero, "msg-fiche-docs"); return; }
      if (acc.length > 1) {
        var ch = prompt("Facturer quel devis accepté ? Numéro :\n" + acc.map(function (d, i) { return (i + 1) + ". " + d.numero + " — " + (d.objet || "") + " (" + gEuros(d.total_ht) + " HT)"; }).join("\n") + "\n\n(0 = facture sans devis)", "1");
        if (ch === null) return;
        var d = acc[Number(ch) - 1]; if (d) { factureDepuisDevis(d.numero, "msg-fiche-docs"); return; }
      }
      var nf = document.querySelector('nav button[data-onglet="factu"]'); if (nf) nf.click();
      ouvrirDoc("facture", ""); $("gd-commune").value = com; $("gd-commune").dispatchEvent(new Event("change"));
      msg("msg-doc", acc.length ? "Facture sans devis : ajoutez les lignes, ou choisissez un « Devis d'origine » pour reprendre ses lignes." : "Aucun devis accepté à facturer pour cette commune. Ajoutez les lignes, ou choisissez un « Devis d'origine ».", "info");
    });
  })();
  (function () { var st = document.createElement("style"); st.textContent = "@media(max-width:480px){#gfd-nouveau,#gfd-facture{float:none!important;display:inline-block;margin:6px 6px 0 0!important}}"; document.head.appendChild(st); })();


  /* ——— Page Factures : émetteur repliable avec son état, recherche, devis et factures en cartes ——— */
  var GM_OBLIG = [["raison_sociale", "raison sociale"], ["siret", "SIRET"], ["adresse", "adresse"], ["code_postal", "code postal"], ["ville", "ville"], ["iban", "IBAN"]];
  (function () {
    var carte = $("g-emetteur").closest(".carte"), h2 = carte.querySelector("h2");
    var det = document.createElement("details"); det.id = "gm-det"; det.className = "gm-det";
    det.innerHTML = '<summary><span class="gm-tit">Émetteur des devis et factures</span><span id="gm-etat" class="gm-etat">…</span></summary>';
    var corps = document.createElement("div"); corps.className = "gm-corps";
    Array.prototype.slice.call(carte.children).forEach(function (el) { if (el !== h2) corps.appendChild(el); });
    det.appendChild(corps); h2.remove(); carte.appendChild(det);
    // Recherche + résumé, juste sous l'émetteur.
    carte.insertAdjacentHTML("afterend", '<div class="carte" id="gx-carte"><div class="gx-rech"><input id="gx-q" type="search" autocomplete="off" placeholder="🔍 N° de facture ou de devis, commune, client…" aria-label="Rechercher une facture ou un devis">'
      + '<div class="gx-filtres" role="group" aria-label="Type de document"><button type="button" data-gx="tout" class="on">Tout</button><button type="button" data-gx="factures">Factures</button><button type="button" data-gx="devis">Devis</button><button type="button" data-gx="du">À encaisser</button></div></div>'
      + '<div id="gx-res" class="gx-res"></div><div id="gx-resume"></div><div class="msg" id="msg-gx"></div></div>');
  })();
  function gmEtat() {
    var manque = GM_OBLIG.filter(function (k) { return !emet(k[0]); });
    var e = $("gm-etat"); if (!e) return;
    e.className = "gm-etat " + (manque.length ? "ko" : "ok");
    e.textContent = manque.length ? "⚠️ " + manque.length + " à remplir : " + manque.map(function (k) { return k[1]; }).join(", ") : "✅ Complet";
  }
  (function () { var o = dessinerEmetteur; dessinerEmetteur = function () { var r = o.apply(this, arguments); gmEtat(); return r; }; })();
  var GX_FILTRE = "tout";
  function gxFiltrer() {
    var q = String(gVal("gx-q") || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(), mots = q ? q.split(/\s+/) : [];
    var n = { devis: 0, factures: 0 };
    [["g-devis-liste", "devis"], ["g-factures-liste", "factures"]].forEach(function (x) {
      var carte = $(x[0]).closest(".carte"), visibleType = GX_FILTRE === "tout" || GX_FILTRE === x[1] || (GX_FILTRE === "du" && x[1] === "factures");
      carte.hidden = !visibleType;
      Array.prototype.forEach.call($(x[0]).querySelectorAll(".gdf-c"), function (c) {
        var cle = (c.dataset.gdfCle || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
        var ok = mots.every(function (m) { return cle.indexOf(m) >= 0; }) && (GX_FILTRE !== "du" || c.dataset.du === "1");
        c.hidden = !ok; if (ok && visibleType) n[x[1]]++;
      });
      var cpt = carte.querySelector(".gx-n"); if (cpt) cpt.textContent = $(x[0]).querySelectorAll(".gdf-c:not([hidden])").length;
    });
    $("gx-res").textContent = (q || GX_FILTRE !== "tout") ? (n.factures + n.devis ? n.factures + " facture(s), " + n.devis + " devis trouvés" : "Aucun résultat.") : "";
  }
  (function () { var o = dessinerDocs; dessinerDocs = function () {
    var tri = function (a, b) { return (b.date || "").localeCompare(a.date || "") || (b.numero || "").localeCompare(a.numero || ""); };
    var dv = (G.Devis || []).slice().sort(tri), fa = (G.Factures || []).slice().sort(tri);
    $("g-devis-liste").innerHTML = dv.length ? dv.map(function (d) { return gdfCarteDevis(d, true); }).join("") : '<p class="gdf-vide">Aucun devis.</p>';
    $("g-factures-liste").innerHTML = fa.length ? fa.map(function (f) { return gdfCarteFacture(f, true).replace('<div class="gdf-c', '<div data-du="' + (f.statut === "emise" || f.statut === "deposee_chorus" ? 1 : 0) + '" class="gdf-c'); }).join("") : '<p class="gdf-vide">Aucune facture.</p>';
    $("gx-resume").innerHTML = gdfResume(dv, fa);
    [["g-devis-liste", "Devis"], ["g-factures-liste", "Factures"]].forEach(function (x) {
      var h2 = $(x[0]).closest(".carte").querySelector("h2"); if (h2 && !h2.querySelector(".gx-n")) h2.firstChild.textContent = x[1] + " "; if (h2 && !h2.querySelector(".gx-n")) h2.firstChild.after(Object.assign(document.createElement("span"), { className: "gx-n" }));
    });
    gxFiltrer();
  }; })();
  $("gx-q").addEventListener("input", gxFiltrer);
  $("gx-carte").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gx]"); if (!b) return;
    GX_FILTRE = b.dataset.gx; Array.prototype.forEach.call(document.querySelectorAll("[data-gx]"), function (x) { x.classList.toggle("on", x === b); }); gxFiltrer();
  });
  // Actions des cartes dans les listes de la page Factures.
  ["g-devis-liste", "g-factures-liste"].forEach(function (id) {
    $(id).addEventListener("click", function (e) {
      var f = e.target.closest("[data-gfacturer]");
      if (f) { e.preventDefault(); e.stopImmediatePropagation(); factureDepuisDevis(f.dataset.gfacturer, "msg-gx"); return; }
      var sp = e.target.closest("[data-gsuppr-doc]"); if (!sp) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (!confirm("Supprimer ce brouillon (" + (sp.dataset.gsupprDoc === "devis" ? "devis" : "facture") + ", avec ses lignes) ?")) return;
      if (G_DOC && G_DOC.d && G_DOC.d.numero === sp.dataset.num) { $("g-doc").hidden = true; G_DOC = null; }
      gEnvoyer({ op: "supprimer-document", type: sp.dataset.gsupprDoc, numero: sp.dataset.num }, "msg-gx", "Brouillon supprimé.").catch(function () {});
    }, true);
  });
  // « Nouvelle facture » (page Factures) : propose d'abord les devis acceptés pas encore facturés.
  $("g-facture-nouvelle").addEventListener("click", function (e) {
    var acc = (G.Devis || []).filter(function (d) { return d.statut === "accepte" && !gdFactureDuDevis(d.numero); }); if (!acc.length) return;
    e.stopImmediatePropagation();
    var ch = prompt("Facturer un devis accepté ? Numéro :\n" + acc.map(function (d, i) { return (i + 1) + ". " + d.numero + " — " + gNomCommune(d.commune) + " (" + gEuros(d.total_ht) + " HT)"; }).join("\n") + "\n\n(0 = facture vierge)", "1");
    if (ch === null) return;
    var d = acc[Number(ch) - 1]; if (d) factureDepuisDevis(d.numero, "msg-gx"); else ouvrirDoc("facture", "");
  }, true);
  (function () { var st = document.createElement("style"); st.textContent =
    ".gm-det summary{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;list-style:none;font-size:18px;font-weight:700;padding:2px 0}.gm-det summary::-webkit-details-marker{display:none}"
    + ".gm-det summary:after{content:'▾';font-size:16px;color:var(--doux);margin-left:auto}.gm-det[open] summary:after{content:'▴'}.gm-corps{margin-top:10px}"
    + ".gm-etat{font-size:13px;font-weight:600;border-radius:999px;padding:4px 10px}.gm-etat.ok{background:#E3F1E7;color:var(--vert)}.gm-etat.ko{background:#FDECEA;color:#8a1c14}"
    + ".gx-rech input{font-size:17px;padding:12px 14px;margin:0 0 8px}.gx-filtres{display:flex;gap:6px;flex-wrap:wrap}.gx-filtres button{flex:1 1 auto;min-height:40px;border:1px solid var(--trait);background:#fff;border-radius:999px;padding:6px 12px;font:600 14px system-ui;color:var(--vert);cursor:pointer}"
    + ".gx-filtres button.on{background:var(--vert);border-color:var(--vert);color:#fff}.gx-res{font-size:14px;color:var(--doux);margin:8px 0 4px}#gx-resume{margin-top:8px}"
    + ".gx-n{display:inline-block;background:#EEF5F0;border-radius:999px;padding:1px 9px;font-size:13px;vertical-align:middle;margin-right:6px}.gdf-com{font-weight:700;color:var(--vert);margin-top:2px}"
    + "#g-devis-liste,#g-factures-liste{font-size:15px}@media(max-width:480px){#g-devis-nouveau,#g-facture-nouvelle{float:none!important;display:block;width:100%;margin-top:8px}}";
    document.head.appendChild(st); })();


  /* ——— Soumettre un devis : e-mail préparé (avec le PDF à joindre), statut « Soumis », relance dans l'agenda ——— */
  function gsoDate(n) { var z = new Date(); z.setDate(z.getDate() + n); return z.toISOString().slice(0, 10); }
  function soumettreDevis(numero, rel) {
    var d = (G.Devis || []).filter(function (x) { return x.numero === numero; })[0]; if (!d) return;
    rel = rel || null; // relance : { ech: id de l'échange « Relancer le devis … » }
    if (String(d.numero).indexOf("BROUILLON") === 0 && !d.numero) return;
    var cl = gClient(d.commune), nomC = gNomCommune(d.commune);
    var lignes = (G.Lignes || []).filter(function (l) { return l.document === numero; }).sort(function (a, b) { return Number(a.num) - Number(b.num); });
    var tva = Number(String(d.taux_tva || emet("taux_tva") || 20).replace(",", ".")) || 0, ht = gNum(d.total_ht), ttc = d.total_ttc ? gNum(d.total_ttc) : ht * (1 + tva / 100);
    var validite = d.validite || (function () { var n = Number(emet("validite_devis_jours")) || 30, z = new Date((d.date || new Date().toISOString().slice(0, 10)) + "T12:00:00"); z.setDate(z.getDate() + n); return z.toISOString().slice(0, 10); })();
    var contacts = (G.Contacts || []).filter(function (c) { return c.commune === d.commune && c.email; });
    var mails = []; [cl.email_facturation].concat(contacts.filter(function (c) { return c.facturation === "oui"; }).map(function (c) { return c.email; }), contacts.map(function (c) { return c.email; })).forEach(function (m) { if (m && mails.indexOf(m) < 0) mails.push(m); });
    var envois = (G.Echanges || []).filter(function (e) { return e.commune === d.commune && new RegExp("Devis " + d.numero.replace(/[-]/g, "\\-") + " (envoyé|renvoyé|relancé)").test(e.resume || ""); }).sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    var mDernier = envois.length && String(envois[0].resume).match(/ à (\S+@\S+)/); if (mDernier) mDernier[1] = mDernier[1].replace(/[.,;:]+$/, "");
    if (mDernier && mails.indexOf(mDernier[1]) < 0) mails.unshift(mDernier[1]); else if (mDernier) { mails.splice(mails.indexOf(mDernier[1]), 1); mails.unshift(mDernier[1]); }
    var nbRel = envois.filter(function (e) { return /relancé/.test(e.resume || ""); }).length;
    var envoyeLe = (envois.filter(function (e) { return /envoyé/.test(e.resume || ""); }).pop() || {}).date;
    var nj = Number(emet("relance_devis_jours")) || 10, relance = gsoDate(nj);
    var limite = (function () { var z = new Date(validite + "T12:00:00"); z.setDate(z.getDate() - 3); return z.toISOString().slice(0, 10); })();
    if (limite > gsoDate(1) && relance > limite) relance = limite;
    var signature = [emet("raison_sociale"), emet("telephone") ? "Tél. " + emet("telephone") : "", emet("email")].filter(Boolean).join("\n");
    var objet = (rel ? "Relance — " : "") + "Devis " + d.numero + " — " + (d.objet || "Suivi des points de collecte");
    var corps = "Madame, Monsieur,\n\nVeuillez trouver ci-joint notre devis n° " + d.numero + " du " + gDateFR(d.date) + (d.objet ? " (" + d.objet + ")" : "")
      + ", d'un montant de " + gEuros(ht) + " HT, soit " + gEuros(ttc) + " TTC. Il est valable jusqu'au " + gDateFR(validite) + ".\n\n"
      + "Pour l'accepter, il suffit de nous le retourner daté et signé avec la mention « Bon pour accord ».\n\nNous restons à votre disposition pour toute question.\n\nBien cordialement,\n" + signature;
    if (rel) corps = "Madame, Monsieur,\n\nNous revenons vers vous au sujet de notre devis n° " + d.numero + " du " + gDateFR(d.date) + (d.objet ? " (" + d.objet + ")" : "")
      + ", d'un montant de " + gEuros(ht) + " HT" + (envoyeLe ? ", que nous vous avons adressé le " + gDateFR(envoyeLe) : "") + ". Il reste valable jusqu'au " + gDateFR(validite) + ".\n\n"
      + "Avez-vous pu en prendre connaissance ? Nous restons à votre disposition pour en parler, répondre à vos questions ou l'ajuster à vos besoins.\n\nVous le trouverez à nouveau ci-joint.\n\nBien cordialement,\n" + signature;
    var fichier = ("Devis-" + d.numero + "-" + nomC).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/-+/g, "-") + ".pdf";
    var dejaEnvoye = d.statut === "envoye" || !!rel;
    var h = '<div class="gch-barre"><b>' + (rel ? "Relancer" : dejaEnvoye ? "Renvoyer" : "Soumettre") + ' le devis ' + gEsc(d.numero) + ' · ' + gEsc(nomC) + '</b><button type="button" id="gso-x" aria-label="Fermer">✕</button></div><div class="gch-corps">'
      + (rel ? '<div class="gdf-alerte">' + (d.statut === "envoye" ? "Relance n° " + (nbRel + 1) + (envoyeLe ? " — devis envoyé le " + gDateFR(envoyeLe) : "") + ". Après l\'envoi, la relance suivante est programmée ci-dessous (videz la date pour ne plus relancer)." : "Ce devis est au statut « " + gLib(G_ST_DEVIS, d.statut) + " » : une relance n\'est sans doute plus utile.") + '</div>'
        : dejaEnvoye ? '<div class="gdf-alerte">Ce devis est déjà au statut « Soumis ». Vous pouvez le renvoyer et reprogrammer la relance.</div>' : '')
      + '<div class="gch-e"><h3><span>1</span>Le PDF à joindre</h3><div id="gso-drive" class="gso-drive">' + (d.pdf_drive ? '<a class="gch-lien" href="' + gEsc(gDrive(d.pdf_drive)) + '" target="_blank" rel="noopener">☁️ PDF du devis sur Drive</a><p class="petit">Dans Gmail (compte ' + gEsc(gCompte()) + '), joignez-le avec « Insérer depuis Drive » : rien à télécharger.</p>' : '<p class="petit">☁️ Archivage du PDF sur Drive…</p>') + '</div>'
      + '<p class="petit">Ou créez-le ici : « Imprimer / Enregistrer en PDF », nom conseillé <b>' + gEsc(fichier) + '</b>.</p><button type="button" class="second" id="gso-pdf">📄 Ouvrir le PDF du devis</button></div>'
      + '<div class="gch-e"><h3><span>2</span>Le message</h3>'
      + '<label for="gso-a"><b>À</b>' + (mails.length ? '' : ' <span class="petit" style="color:var(--ko)">— aucune adresse dans la fiche ni dans les contacts</span>') + '</label><input id="gso-a" type="email" list="gso-l" value="' + gEsc(mails[0] || "") + '" placeholder="mairie@exemple.fr" autocomplete="off"><datalist id="gso-l">' + mails.map(function (m) { return '<option value="' + gEsc(m) + '">'; }).join("") + '</datalist>'
      + '<label for="gso-o"><b>Objet</b></label><input id="gso-o" value="' + gEsc(objet) + '">'
      + '<label for="gso-m"><b>Message</b></label><textarea id="gso-m" rows="11">' + gEsc(corps) + '</textarea>'
      + '<label for="gso-cc"><b>Copie à</b> <span class="petit">— facultatif</span></label><input id="gso-cc" type="email" list="gso-l" value="" placeholder="ex. secretariat@mairie.fr" autocomplete="off">'
      + '<div class="gso-n8n"><button type="button" class="principal" id="gso-envoyer">📤 Envoyer avec le PDF joint</button><div class="petit" id="gso-de">Expéditeur : vérification…</div></div>'
      + '<details class="gso-autres"><summary>Autres façons d\'envoyer (ma messagerie, Gmail, copier)</summary><div class="gso-b"><button type="button" class="second" id="gso-mail">✉️ Ma messagerie</button><button type="button" class="second" id="gso-gmail">Gmail · ' + gEsc(gCompte()) + '</button><button type="button" class="second" id="gso-copie">Copier le message</button></div>'
      + '<p class="petit">Dans ce cas, joignez le PDF vous-même puis notez l\'envoi à l\'étape 3.</p></details><div class="msg" id="msg-gso-envoi"></div></div>'
      + '<div class="gch-e"><h3><span>3</span>La relance</h3>'
      + '<label for="gso-r"><b>' + (rel ? "Relance suivante le" : "Relancer le") + '</b> <span class="petit">— la relance apparaît dans l\'agenda (et Google Agenda) et dans « Échanges »</span></label><input id="gso-r" type="date" value="' + relance + '">'
      + '<p class="petit">Validité du devis : jusqu\'au ' + gDateFR(validite) + '.</p>'
      + '<button type="button" class="second" id="gso-ok">✅ Envoyé par ma messagerie : noter' + (rel ? " la relance" : "") + ' et programmer la suivante</button><div class="msg" id="msg-gso"></div></div></div>';
    var vieux = $("gso"); if (vieux) vieux.remove();
    var o = document.createElement("div"); o.id = "gso"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Soumettre le devis"); o.innerHTML = h;
    document.body.appendChild(o); document.body.style.overflow = "hidden";
    var fermer = function () { o.remove(); document.body.style.overflow = ""; };
    $("gso-x").onclick = fermer;
    var GSO_LIEN = d.pdf_drive ? Promise.resolve(d.pdf_drive) : null, GSO_DE = "";
    api("mail-compte", {}).then(function (j) {
      GSO_DE = j.compte || ""; var e = $("gso-de"); if (!e) return;
      var bon = GSO_DE.toLowerCase() === gCompte().toLowerCase();
      e.innerHTML = 'Expéditeur : <b>' + gEsc(GSO_DE) + '</b>' + (bon ? '' : ' <span style="color:var(--ko)">— ce n\'est pas ' + gEsc(gCompte()) + ' (connexion Gmail de n8n à changer)</span>');
      e.classList.toggle("ko", !bon);
    }).catch(function (er) { GSO_DE = ""; if ($("gso-de")) $("gso-de").innerHTML = '<span style="color:var(--ko)">Envoi par n8n indisponible : ' + gEsc(er.message) + '</span>'; });
    if (!d.pdf_drive) GSO_LIEN = garArchiver("devis", d.numero); GSO_LIEN.then(function (lien) {
      if ($("gso-drive")) $("gso-drive").innerHTML = '<a class="gch-lien" href="' + gEsc(gDrive(lien)) + '" target="_blank" rel="noopener">☁️ PDF du devis sur Drive</a><p class="petit">Dans Gmail (compte ' + gEsc(gCompte()) + '), joignez-le avec « Insérer depuis Drive » : rien à télécharger.</p>';
    }).catch(function (e) { if ($("gso-drive")) $("gso-drive").innerHTML = '<p class="petit" style="color:var(--ko)">Archivage Drive impossible : ' + gEsc(e.message) + '</p>'; });
    var url = function (gmail) {
      var a = gVal("gso-a"), su = encodeURIComponent($("gso-o").value), bo = encodeURIComponent($("gso-m").value);
      return gmail ? "https://mail.google.com/mail/?authuser=" + encodeURIComponent(gCompte()) + "&view=cm&fs=1&to=" + encodeURIComponent(a) + "&su=" + su + "&body=" + bo : "mailto:" + encodeURIComponent(a).replace(/%40/g, "@") + "?subject=" + su + "&body=" + bo;
    };
    $("gso-mail").onclick = function () { if (!gVal("gso-a")) { msg("msg-gso", "Indiquez l'adresse du destinataire.", "ko"); $("gso-a").focus(); return; } window.location.href = url(false); };
    $("gso-gmail").onclick = function () { if (!gVal("gso-a")) { msg("msg-gso", "Indiquez l'adresse du destinataire.", "ko"); $("gso-a").focus(); return; } window.open(url(true), "_blank", "noopener"); };
    $("gso-copie").onclick = function () { gchCopier($("gso-m").value, $("gso-copie")); };
    $("gso-pdf").onclick = function () {
      var t0 = document.title; document.title = fichier.replace(/\.pdf$/, "");
      montrerApercu({ t: "devis", d: Object.assign({}, d), lignes: lignes });
      var ap = $("gd-apercu"); if (ap) { ap.style.zIndex = 130; new MutationObserver(function (m, obs) { if (!document.body.contains(ap)) { document.title = t0; document.body.style.overflow = "hidden"; obs.disconnect(); } }).observe(document.body, { childList: true }); }
    };
    $("gso-envoyer").onclick = function () {
      var a = gVal("gso-a"), r = gVal("gso-r"), b = $("gso-envoyer");
      if (!a) { msg("msg-gso-envoi", "Indiquez l'adresse du destinataire.", "ko"); $("gso-a").focus(); return; }
      if (!r && !confirm("Aucune date de relance. Envoyer quand même ?")) return;
      if (GSO_DE && GSO_DE.toLowerCase() !== gCompte().toLowerCase() && !confirm("Le message partira de " + GSO_DE + " et non de " + gCompte() + ". Envoyer quand même ?")) return;
      if (!confirm((rel ? "Envoyer la relance du devis " : "Envoyer le devis ") + d.numero + " (PDF joint) à " + a + (gVal("gso-cc") ? " et " + gVal("gso-cc") : "") + " ?")) return;
      b.disabled = true; msg("msg-gso-envoi", "Préparation du PDF…");
      (GSO_LIEN || garArchiver("devis", d.numero)).then(function (lien) {
        msg("msg-gso-envoi", "Envoi en cours…");
        return api("envoyer-mail", { type: "devis", numero: d.numero, a: a, cc: gVal("gso-cc"), objet: $("gso-o").value, message: $("gso-m").value, pdf_drive: lien, fichier: fichier, expediteur: emet("raison_sociale") });
      }).then(function (j) {
        msg("msg-gso-envoi", "📤 Message envoyé depuis " + (j.compte || "Gmail") + ".", "ok");
        return gsoNoter(a, r, " par e-mail depuis " + (j.compte || "Gmail"));
      }).catch(function (er) { msg("msg-gso-envoi", "Envoi impossible : " + er.message, "ko"); b.disabled = false; });
    };
    function gsoNoter(a, r, via) {
      msg("msg-gso", "Enregistrement…");
      var etape = Promise.resolve();
      if (!dejaEnvoye) {
        var e = { numero: d.numero };
        ["commune", "date", "objet", "accepte_le", "accepte_par", "ref_points", "taux_tva", "notes"].forEach(function (k) { if (d[k] !== undefined) e[k] = d[k]; });
        e.statut = "envoye";
        var lg = lignes.map(function (l) { return { designation: l.designation, site_code: l.site_code, quantite: l.quantite, prix_unitaire_ht: l.prix_unitaire_ht, periode_debut: l.periode_debut, periode_fin: l.periode_fin }; });
        etape = api("gestion", { op: "document", type: "devis", entete: e, lignes: lg });
      }
      var contact = (contacts.filter(function (c) { return c.email === a; })[0] || {}).nom || a;
      if (rel && rel.ech) etape = etape.then(function () { return api("gestion", { op: "enregistrer", onglet: "Echanges", valeurs: { id: rel.ech, fait: "oui" } }); });
      etape.then(function () {
        return api("gestion", { op: "enregistrer", onglet: "Echanges", valeurs: { id: "", commune: d.commune, date: new Date().toISOString().slice(0, 10), type: "email", contact: contact,
          resume: (rel ? "Devis " + d.numero + " relancé (relance n° " + (nbRel + 1) + ")" : dejaEnvoye ? "Devis " + d.numero + " renvoyé" : "Devis " + d.numero + " envoyé") + " (" + gEuros(ht) + " HT)" + (a ? " à " + a : "") + (via || "") + ".", prochaine_action: r ? "Relancer le devis " + d.numero : "", echeance: r, fait: r ? "non" : "oui" } });
      }).then(function () {
        syncAgendaPlusTard(); return chargerGestion(true);
      }).then(function () {
        msg("msg-gso", (rel ? "Relance notée" : "Devis noté « Soumis »") + (r ? ", relance " + (rel ? "suivante " : "") + "programmée le " + gDateFR(r) : "") + ".", "ok");
        if (G_DOC && G_DOC.type === "devis" && G_DOC.d.numero === d.numero) ouvrirDoc("devis", d.numero);
        setTimeout(fermer, 1400);
      }).catch(function (er) { msg("msg-gso", er.message, "ko"); $("gso-ok").disabled = false; });
    }
    $("gso-ok").onclick = function () {
      var a = gVal("gso-a"), r = gVal("gso-r");
      if (!r && !confirm("Aucune date de relance. Continuer sans relance ?")) return;
      $("gso-ok").disabled = true; gsoNoter(a, r, "");
    };
  }
  // Bouton dans l'éditeur de devis, et ouverture automatique quand on passe le statut à « Soumis ».
  $("g-doc-pdf").insertAdjacentHTML("afterend", '<button class="second" id="g-doc-soumettre" type="button" style="flex:1" hidden>📨 Soumettre</button>');
  $("g-doc-soumettre").addEventListener("click", function () { if (G_DOC && G_DOC.d.numero) soumettreDevis(G_DOC.d.numero); });
  var GSO_APRES = false;
  $("g-doc-ok").addEventListener("click", function () { GSO_APRES = !!(G_DOC && G_DOC.type === "devis" && G_DOC.d.statut !== "envoye" && gVal("gd-statut") === "envoye"); }, true);
  (function () { var o = ouvrirDoc; ouvrirDoc = function () { var r = o.apply(this, arguments); var d = G_DOC && G_DOC.d;
    var ok = !!(G_DOC && G_DOC.type === "devis" && d.numero && (d.statut === "brouillon" || d.statut === "envoye"));
    $("g-doc-soumettre").hidden = !ok; $("g-doc-soumettre").textContent = d && d.statut === "envoye" ? "📨 Renvoyer" : "📨 Soumettre";
    if (GSO_APRES && ok && d.statut === "envoye") { GSO_APRES = false; setTimeout(function () { soumettreDevis(d.numero); }, 50); }
    return r; }; })();
  ["g-fiche-docs", "g-devis-liste"].forEach(function (id) {
    var box = $(id); if (!box) return;
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-gsoum]"); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); soumettreDevis(b.dataset.gsoum); }, true);
  });
  (function () { var st = document.createElement("style"); st.textContent =
    "#gso{position:fixed;inset:0;z-index:125;background:#F4F1EA;display:flex;flex-direction:column}#gso-x{border:0;background:transparent;color:#fff;font-size:20px;padding:6px 12px;cursor:pointer}"
    + "#gso textarea{font:15px/1.45 system-ui;width:100%;box-sizing:border-box}#gso .principal,#gso .second{min-height:44px}#gso-ok{width:100%;margin-top:10px}"
    + ".gso-b{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.gso-b button{flex:1 1 auto;margin:0}"
    + ".gso-n8n{margin-top:12px}.gso-n8n .principal{width:100%;margin:0 0 6px}.gso-autres{margin-top:12px}.gso-autres summary{cursor:pointer;color:var(--vert);font-weight:600;font-size:14px}";
    document.head.appendChild(st); })();


  /* ——— Archivage des PDF sur Google Drive (via n8n) ———
     Le PDF est fabriqué ici avec pdfmake (texte réel, lisible par Chorus Pro), envoyé à n8n qui le range
     dans le dossier Drive « Devis et factures (PAV) », puis le lien est noté sur le document (colonne pdf_drive). */
  var GAR_PDFMAKE = null;
  function garCharger() {
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve(window.pdfMake);
    if (GAR_PDFMAKE) return GAR_PDFMAKE;
    var src = function (u) { return new Promise(function (ok, ko) { var sc = document.createElement("script"); sc.src = u; sc.onload = ok; sc.onerror = function () { ko(new Error("Chargement impossible : " + u)); }; document.head.appendChild(sc); }); };
    var base = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/";
    GAR_PDFMAKE = src(base + "pdfmake.min.js").then(function () { return src(base + "vfs_fonts.js"); }).then(function () { return window.pdfMake; })
      .catch(function (e) { GAR_PDFMAKE = null; throw e; });
    return GAR_PDFMAKE;
  }
  function garDoc(type, numero) {
    var o = type === "devis" ? "Devis" : "Factures";
    var d = (G[o] || []).filter(function (x) { return x.numero === numero; })[0]; if (!d) throw new Error("Document " + numero + " introuvable.");
    var lignes = (G.Lignes || []).filter(function (l) { return l.document === numero; }).sort(function (a, b) { return Number(a.num) - Number(b.num); });
    return { t: type, d: d, lignes: lignes };
  }
  function garFichier(x) { return ((x.t === "devis" ? "Devis-" : "Facture-") + x.d.numero + "-" + gNomCommune(x.d.commune)).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/-+/g, "-") + ".pdf"; }
  function garDefinition(x) {
    var t = x.t, d = x.d, cl = gClient(d.commune), tva = Number(String(d.taux_tva || emet("taux_tva") || 20).replace(",", ".")) || 0;
    var VERT = "#1F3A2E", GRIS = "#666666", ht = 0;
    var corps = x.lignes.map(function (l) {
      var q = gNum(l.quantite), pu = gNum(l.prix_unitaire_ht), tl = q * pu; ht += tl;
      var des = [{ text: String(l.designation || "") }];
      if (l.site_code) des.push({ text: "Point " + l.site_code, fontSize: 8, color: GRIS });
      if (l.periode_debut) des.push({ text: "Du " + gDateFR(l.periode_debut) + " au " + gDateFR(l.periode_fin), fontSize: 8, color: GRIS });
      return [{ stack: des }, { text: String(q).replace(".", ","), alignment: "right" }, { text: gEuros(pu), alignment: "right" }, { text: gEuros(tl), alignment: "right" }];
    });
    var mt = ht * tva / 100, ttc = ht + mt;
    var jours = function (cle, def, base) { var n = Number(emet(cle)) || def, z = new Date((base || new Date().toISOString().slice(0, 10)) + "T12:00:00"); z.setDate(z.getDate() + n); return z.toISOString().slice(0, 10); };
    var validite = d.validite || jours("validite_devis_jours", 30, d.date), echeance = d.echeance || jours("delai_paiement_jours", 30, d.date);
    var titre = t === "devis" ? "DEVIS" : "FACTURE";
    var em = [{ text: emet("raison_sociale") || "Raison sociale", bold: true, fontSize: 12 }];
    [emet("forme_juridique"), emet("adresse"), (emet("code_postal") + " " + emet("ville")).trim(), emet("telephone") ? "Tél. " + emet("telephone") : "", emet("email"), emet("siret") ? "SIRET " + emet("siret") : "", emet("tva_intracom") ? "TVA " + emet("tva_intracom") : ""]
      .filter(Boolean).forEach(function (l) { em.push({ text: l, fontSize: 9, color: "#333333" }); });
    var dest = [{ text: t === "devis" ? "DESTINATAIRE" : "FACTURÉ À", fontSize: 7, color: "#777777", characterSpacing: 1 }, { text: cl.nom_officiel || ("Mairie de " + gNomCommune(d.commune)), bold: true }];
    [cl.adresse_facturation, ((cl.code_postal || "") + " " + (cl.ville || "")).trim(), cl.siret ? "SIRET " + cl.siret : "", cl.code_service_chorus ? "Code service Chorus : " + cl.code_service_chorus : ""]
      .filter(Boolean).forEach(function (l) { dest.push({ text: l, fontSize: 9 }); });
    var mentions = [];
    if (!tva && emet("mention_tva")) mentions.push(emet("mention_tva"));
    if (t === "devis") mentions.push("Devis valable jusqu'au " + gDateFR(validite) + ". Pour accepter, retourner ce devis daté et signé avec la mention « Bon pour accord ».");
    else {
      mentions.push("Paiement à " + (Number(emet("delai_paiement_jours")) || 30) + " jours, soit au plus tard le " + gDateFR(echeance) + ", par virement (mandat administratif).");
      if (emet("iban")) mentions.push("IBAN " + emet("iban") + (emet("bic") ? " · BIC " + emet("bic") : ""));
      mentions.push("En cas de retard de paiement : intérêts moratoires au taux légal applicable aux pouvoirs adjudicateurs et indemnité forfaitaire pour frais de recouvrement de 40 €.");
      if (cl.siret) mentions.push("Facture déposée sur Chorus Pro (SIRET destinataire " + cl.siret + (cl.code_service_chorus ? ", service " + cl.code_service_chorus : "") + ").");
    }
    if (emet("conditions")) mentions.push(emet("conditions"));
    if (d.notes) mentions.push(d.notes);
    var ref = t === "devis" ? (d.objet ? [{ text: [{ text: "Objet : ", bold: true }, d.objet], margin: [0, 0, 0, 8] }] : [])
      : [{ text: [d.periode_debut ? { text: "Période : ", bold: true } : "", d.periode_debut ? "du " + gDateFR(d.periode_debut) + " au " + gDateFR(d.periode_fin) : "", d.ref_devis ? { text: (d.periode_debut ? "   ·   " : "") + "Devis : ", bold: true } : "", d.ref_devis || ""], margin: [0, 0, 0, 8] }];
    var tot = [[{ text: "Total HT" }, { text: gEuros(ht), alignment: "right", bold: true }]];
    if (tva) tot.push([{ text: "TVA " + String(tva).replace(".", ",") + " %" }, { text: gEuros(mt), alignment: "right" }]);
    tot.push([{ text: "Total TTC", bold: true, color: "#ffffff", fillColor: VERT }, { text: gEuros(ttc), alignment: "right", bold: true, color: "#ffffff", fillColor: VERT }]);
    var contenu = [
      { columns: [{ width: "*", stack: em }, { width: "auto", stack: [{ text: titre, fontSize: 22, bold: true, color: VERT, alignment: "right", characterSpacing: 1 }, { text: "N° " + d.numero, bold: true, alignment: "right" },
        { text: "Date : " + gDateFR(d.date), fontSize: 9, color: "#555555", alignment: "right" }, { text: t === "devis" ? "Valable jusqu'au " + gDateFR(validite) : "Échéance : " + gDateFR(echeance), fontSize: 9, color: "#555555", alignment: "right" }] }] },
      { columns: [{ width: "*", text: "" }, { width: 240, table: { widths: ["*"], body: [[{ stack: dest, margin: [6, 6, 6, 6] }]] }, layout: { hLineColor: function () { return "#cfd4cd"; }, vLineColor: function () { return "#cfd4cd"; } } }], margin: [0, 28, 0, 18] }
    ].concat(ref).concat([
      { table: { headerRows: 1, widths: ["*", 40, 80, 80], body: [[{ text: "DÉSIGNATION", style: "th" }, { text: "QTÉ", style: "th", alignment: "right" }, { text: "PRIX UNIT. HT", style: "th", alignment: "right" }, { text: "TOTAL HT", style: "th", alignment: "right" }]].concat(corps.length ? corps : [[{ text: "Aucune ligne.", colSpan: 4 }, "", "", ""]]) },
        layout: { fillColor: function (i) { return i === 0 ? VERT : null; }, hLineWidth: function (i) { return i === 0 ? 0 : 0.5; }, vLineWidth: function () { return 0; }, hLineColor: function () { return "#e4e1d8"; }, paddingTop: function () { return 6; }, paddingBottom: function () { return 6; } } },
      { columns: [{ width: "*", text: "" }, { width: 210, table: { widths: ["*", "auto"], body: tot }, layout: "noBorders", margin: [0, 12, 0, 0] }] },
      { stack: mentions.map(function (m) { return { text: m, fontSize: 8.5, color: "#444444", margin: [0, 2, 0, 0] }; }), margin: [0, 22, 0, 0] }
    ]);
    if (t === "devis") contenu.push({ columns: [{ width: "*", table: { widths: ["*"], heights: [80], body: [[{ text: "Pour " + (emet("raison_sociale") || "l'émetteur"), fontSize: 9, color: "#555555" }]] }, layout: { hLineColor: function () { return "#cfd4cd"; }, vLineColor: function () { return "#cfd4cd"; } } },
      { width: "*", table: { widths: ["*"], heights: [80], body: [[{ text: "Bon pour accord — date, nom, qualité et signature\nPour la commune de " + gNomCommune(d.commune), fontSize: 9, color: "#555555" }]] }, layout: { hLineColor: function () { return "#cfd4cd"; }, vLineColor: function () { return "#cfd4cd"; } } }], columnGap: 16, margin: [0, 24, 0, 0] });
    var pied = [emet("raison_sociale"), emet("forme_juridique"), emet("siret") ? "SIRET " + emet("siret") : "", emet("tva_intracom") ? "TVA " + emet("tva_intracom") : ""].filter(Boolean).join(" · ");
    return { pageSize: "A4", pageMargins: [42, 46, 42, 54], info: { title: (t === "devis" ? "Devis " : "Facture ") + d.numero, author: emet("raison_sociale") || "PAV" },
      content: contenu, defaultStyle: { fontSize: 10, color: "#1d2420" }, styles: { th: { bold: true, fontSize: 8, color: "#ffffff" } },
      footer: function (p, n) { return { columns: [{ text: pied, fontSize: 7, color: "#777777" }, { text: p + " / " + n, fontSize: 7, color: "#777777", alignment: "right", width: 40 }], margin: [42, 16, 42, 0] }; } };
  }
  function garDossier() {
    var id = emet("drive_archive_dossier"); if (id) return Promise.resolve(id);
    return api("archive-dossier", {}).then(function (j) {
      if (!j.dossier) throw new Error("Dossier Drive non créé.");
      G.Emetteur = (G.Emetteur || []).filter(function (p) { return p.cle !== "drive_archive_dossier"; }).concat([{ cle: "drive_archive_dossier", valeur: j.dossier }]);
      return api("gestion", { op: "enregistrer", onglet: "Emetteur", valeurs: { cle: "drive_archive_dossier", valeur: j.dossier, description: "Dossier Google Drive des PDF de devis et factures (créé par la console)" } }).then(function () { return j.dossier; });
    });
  }
  // Archive un devis / une facture : renvoie le lien Drive. idMsg : zone de message (facultatif).
  function garArchiver(type, numero, idMsg) {
    var x; try { x = garDoc(type, numero); } catch (e) { return Promise.reject(e); }
    if (String(numero).indexOf("BROUILLON") === 0) return Promise.reject(new Error("Enregistrez d'abord le document pour obtenir son numéro."));
    if (idMsg) msg(idMsg, "☁️ Archivage du PDF sur Drive…");
    var fichier = garFichier(x), dossier;
    return garDossier().then(function (id) { dossier = id; return garCharger(); }).then(function (pm) {
      return new Promise(function (ok, ko) { try { pm.createPdf(garDefinition(x)).getBase64(ok); } catch (e) { ko(e); } });
    }).then(function (b64) {
      return api("archiver", { type: type, numero: numero, fichier: fichier, dossier: dossier, pdf: b64 });
    }).then(function (j) {
      if (!j.lien) throw new Error("Archivage : lien Drive manquant.");
      return api("gestion", { op: "document", type: type, entete: { numero: numero, pdf_drive: j.lien } }).then(function () { return chargerGestion(true); }).then(function () {
        if (G_DOC && G_DOC.d.numero === numero) ouvrirDoc(type, numero);
        if (idMsg) msg(idMsg, "☁️ PDF archivé sur Drive : " + fichier, "ok");
        return j.lien;
      });
    }).catch(function (e) { if (idMsg) msg(idMsg, "Archivage Drive impossible : " + e.message, "ko"); throw e; });
  }
  // Éditeur : bouton Drive (ouvrir / archiver) ; archivage automatique à l'émission d'une facture.
  $("g-doc-pdf").insertAdjacentHTML("afterend", '<button class="second" id="g-doc-drive" type="button" style="flex:1" hidden>☁️ Drive</button>');
  $("g-doc-drive").addEventListener("click", function () {
    if (!G_DOC || !G_DOC.d.numero) return;
    if (G_DOC.d.pdf_drive && !confirm("Ce document est déjà archivé sur Drive.\n\nOK : l'ouvrir · Annuler : créer une nouvelle version")) { garArchiver(G_DOC.type, G_DOC.d.numero, "msg-doc").catch(function () {}); return; }
    if (G_DOC.d.pdf_drive) { window.open(gDrive(G_DOC.d.pdf_drive), "_blank", "noopener"); return; }
    garArchiver(G_DOC.type, G_DOC.d.numero, "msg-doc").catch(function () {});
  });
  var GAR_APRES = false;
  $("g-doc-ok").addEventListener("click", function () { GAR_APRES = !!(G_DOC && G_DOC.type === "facture" && G_DOC.d.statut === "brouillon" && gVal("gd-statut") === "emise"); }, true);
  (function () { var o = ouvrirDoc; ouvrirDoc = function () { var r = o.apply(this, arguments); var d = G_DOC && G_DOC.d;
    var ok = !!(G_DOC && d.numero && String(d.numero).indexOf("BROUILLON") !== 0 && d.statut !== "brouillon");
    $("g-doc-drive").hidden = !ok; $("g-doc-drive").textContent = d && d.pdf_drive ? "☁️ PDF sur Drive" : "☁️ Archiver sur Drive";
    if (GAR_APRES && ok && G_DOC.type === "facture" && d.statut === "emise" && !d.pdf_drive) { GAR_APRES = false; var n = d.numero; setTimeout(function () { garArchiver("facture", n, "msg-doc").catch(function () {}); }, 50); }
    return r; }; })();
  (function () { var st = document.createElement("style"); st.textContent = ".gdf-a a.gdf-drive{flex:1 1 auto;min-height:42px;display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;font-size:14px;border-radius:10px;border:1px solid var(--trait);background:#fff;color:var(--vert);font-weight:600;text-decoration:none}"; document.head.appendChild(st); })();


  /* ——— Relances de devis : bouton dans l'Agenda, et lien direct (?relance=N°&ech=id) depuis l'e-mail du matin ——— */
  function relancerDevis(numero, ech) {
    if (!(G.Devis || []).some(function (x) { return x.numero === numero; })) { msg("msg-rdv", "Devis " + numero + " introuvable.", "ko"); return; }
    soumettreDevis(numero, { ech: ech || "" });
  }
  (function () { var o = ligneEv; ligneEv = function (x) {
    var h = o.apply(this, arguments), m = x.type === "action" && x.id && /Relancer le devis (\S+)/.exec(x.titre || "");
    if (!m) return h;
    return h.replace('</span><button type="button" class="ga-del" data-ga-fait', ' <button type="button" class="ga-rel" data-ga-relance="' + gEsc(m[1]) + '" data-ga-ech="' + gEsc(x.id) + '">📨 Relancer</button></span><button type="button" class="ga-del" data-ga-fait');
  }; })();
  ["ga-liste", "ga-retard"].forEach(function (id) {
    var box = $(id); if (!box) return;
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-ga-relance]"); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); relancerDevis(b.dataset.gaRelance, b.dataset.gaEch); }, true);
  });
  (function () {
    var q = new URLSearchParams(location.search), n = q.get("relance"); if (!n) return;
    var ech = q.get("ech") || "", essais = 0;
    var t = setInterval(function () {
      var v = $("verrou"); if (++essais > 240) { clearInterval(t); return; }
      if (v && getComputedStyle(v).display !== "none") return;
      clearInterval(t);
      (G_CHARGE ? Promise.resolve() : chargerGestion()).then(function () {
        var nf = document.querySelector('nav button[data-onglet="agenda"]'); if (nf) nf.click();
        try { history.replaceState(null, "", location.pathname); } catch (er) {}
        relancerDevis(n, ech);
      });
    }, 500);
  })();
  (function () { var st = document.createElement("style"); st.textContent = ".ga-rel{border:1px solid var(--trait);background:#FFF4DF;color:#8a5a00;border-radius:999px;padding:3px 10px;font:600 12.5px system-ui;cursor:pointer;margin-left:4px;white-space:nowrap}"; document.head.appendChild(st); })();


  /* ——— À l'ouverture de la console : fenêtre « Aujourd'hui » (événements du jour et en retard) + pastille sur l'onglet Agenda ——— */
  function gjDuJour() {
    var auj = new Date().toISOString().slice(0, 10);
    return evenements().filter(function (x) {
      if (x.passe || x.type === "echange" || x.type === "fait") return false;
      return x.date === auj || (x.retard && /^(action|devis|facture)$/.test(x.type));
    }).sort(function (a, b) { return (b.retard ? 1 : 0) - (a.retard ? 1 : 0) || a.date.localeCompare(b.date); });
  }
  function gjPastille() {
    var b = document.querySelector('nav button[data-onglet="agenda"]'); if (!b || !G) return;
    var n = gjDuJour().length, p = b.querySelector(".gj-n");
    if (!n) { if (p) p.remove(); return; }
    if (!p) { p = document.createElement("span"); p.className = "gj-n"; b.appendChild(p); }
    p.textContent = n; p.title = n + " événement(s) aujourd'hui ou en retard";
  }
  function gjFenetre(forcer) {
    var l = gjDuJour(), auj = new Date().toISOString().slice(0, 10);
    gjPastille();
    if (!l.length && !forcer) return;
    try { if (!forcer && localStorage.getItem("pav-console-aujourdhui") === auj) return; } catch (e) {}
    var vieux = $("gj"); if (vieux) vieux.remove();
    var icone = { action: "📌", devis: "📝", facture: "🧾", anniversaire: "🎂", rappel: "⏰", rdv: "📅" };
    var lignes = l.map(function (x, i) {
      var rel = x.type === "action" && x.id && /Relancer le devis (\S+)/.exec(x.titre || "");
      var bouton = rel ? '<button type="button" class="principal" data-gj-rel="' + gEsc(rel[1]) + '" data-gj-ech="' + gEsc(x.id) + '">📨 Relancer</button>'
        : x.doc ? '<button type="button" class="second" data-gj-doc="' + gEsc(x.doc[0]) + '" data-gj-num="' + gEsc(x.doc[1]) + '">Ouvrir</button>'
        : x.commune ? '<button type="button" class="second" data-gj-com="' + gEsc(x.commune) + '">Fiche</button>' : '';
      return '<div class="gj-l' + (x.retard ? ' retard' : '') + '"><span class="gj-i">' + (icone[x.type] || "•") + '</span><div class="gj-t"><b>' + gEsc(x.titre) + '</b><small>'
        + gEsc(x.nomCommune || "") + (x.heure ? " · " + gEsc(x.heure) : "") + (x.retard ? ' · <span class="ko">en retard depuis le ' + gDateFR(x.date) + '</span>' : x.date === auj ? " · aujourd'hui" : "") + '</small></div>' + bouton + '</div>';
    }).join("") || '<p class="petit">Rien de prévu aujourd\'hui, et aucun retard. 👍</p>';
    var f = document.createElement("div"); f.id = "gj"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Aujourd'hui");
    f.innerHTML = '<div class="gj-boite"><div class="gj-h"><b>📅 Aujourd\'hui · ' + new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + '</b><button type="button" id="gj-x" aria-label="Fermer">✕</button></div>'
      + '<div class="gj-c">' + (l.length ? '<p class="petit">' + l.length + ' élément' + (l.length > 1 ? 's' : '') + ' à traiter' + (l.some(function (x) { return x.retard; }) ? ', dont des retards' : '') + '.</p>' : '') + lignes + '</div>'
      + '<div class="gj-b"><button type="button" class="second" id="gj-plus">Ne plus afficher aujourd\'hui</button><button type="button" class="principal" id="gj-agenda">Ouvrir l\'Agenda</button></div></div>';
    document.body.appendChild(f);
    var fermer = function () { f.remove(); };
    $("gj-x").onclick = fermer;
    f.addEventListener("click", function (e) { if (e.target === f) fermer(); });
    $("gj-plus").onclick = function () { try { localStorage.setItem("pav-console-aujourdhui", auj); } catch (er) {} fermer(); };
    $("gj-agenda").onclick = function () { fermer(); var b = document.querySelector('nav button[data-onglet="agenda"]'); if (b) b.click(); };
    f.addEventListener("click", function (e) {
      var b = e.target.closest("[data-gj-rel],[data-gj-doc],[data-gj-com]"); if (!b) return;
      fermer();
      if (b.dataset.gjRel) { var a = document.querySelector('nav button[data-onglet="agenda"]'); if (a) a.click(); relancerDevis(b.dataset.gjRel, b.dataset.gjEch); return; }
      if (b.dataset.gjDoc) { var nf = document.querySelector('nav button[data-onglet="factu"]'); if (nf) nf.click(); ouvrirDoc(b.dataset.gjDoc, b.dataset.gjNum); return; }
      var nc = document.querySelector('nav button[data-onglet="clients"]'); if (nc) nc.click();
      setTimeout(function () { $("g-commune").value = b.dataset.gjCom; dessinerFiche(); }, 40);
    });
  }
  (function () { var o = dessinerAgenda; dessinerAgenda = function () { var r = o.apply(this, arguments); try { gjPastille(); } catch (e) {} return r; }; })();
  (function () {
    if (new URLSearchParams(location.search).get("relance")) return;
    var essais = 0, t = setInterval(function () {
      var v = $("verrou"); if (++essais > 600) { clearInterval(t); return; }
      if (v && getComputedStyle(v).display !== "none") return;
      clearInterval(t);
      (G_CHARGE ? Promise.resolve() : chargerGestion()).then(function () { if (G) gjFenetre(false); }).catch(function () {});
    }, 500);
  })();
  (function () { var st = document.createElement("style"); st.textContent =
    "#gj{position:fixed;inset:0;z-index:118;background:rgba(20,30,25,.45);display:flex;align-items:flex-start;justify-content:center;padding:6vh 12px 12px}"
    + ".gj-boite{background:#FAF8F3;border-radius:16px;width:100%;max-width:560px;max-height:86vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.25);overflow:hidden}"
    + ".gj-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:#1F3A2E;color:#fff;font-size:16px}.gj-h b:first-letter{text-transform:uppercase}#gj-x{border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer}"
    + ".gj-c{overflow:auto;padding:10px 14px}.gj-l{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--trait);border-radius:12px;background:#fff;margin-bottom:8px}.gj-l.retard{border-color:#f2b8b5;background:#FFF8F7}"
    + ".gj-i{font-size:20px}.gj-t{flex:1;min-width:0}.gj-t b{display:block;font-size:14.5px;line-height:1.3}.gj-t small{color:var(--doux);font-size:12.5px}.gj-t .ko{color:var(--ko);font-weight:600}"
    + ".gj-l{flex-wrap:wrap}.gj-t{flex:1 1 170px}.gj-l button{width:auto!important;flex:0 0 auto;margin:0 0 0 auto!important;padding:8px 14px;min-height:40px;white-space:nowrap;font-size:14px}.gj-b{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--trait);flex-wrap:wrap}.gj-b button{flex:1 1 auto;margin:0;min-height:44px}"
    + ".gj-n{display:inline-block;min-width:18px;padding:1px 6px;margin-left:6px;border-radius:999px;background:#B3261E;color:#fff;font-size:12px;font-weight:700;line-height:16px;text-align:center}";
    document.head.appendChild(st); })();

})();
