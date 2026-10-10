#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Générateur de CV Haute Fidélité — Philippe Hountondji
Produit un document PDF vectoriel A4 (2 pages) équilibré, aux couleurs violet cyberpunk du site.
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from PIL import Image, ImageDraw, ImageOps

# Dimensions A4 en points
PAGE_W, PAGE_H = A4  # 595.27, 841.89

# Palette du Portfolio
C_PRIMARY = colors.HexColor('#7c3aed')     # Violet principal
C_DARK = colors.HexColor('#581c87')        # Violet foncé
C_LIGHT_BG = colors.HexColor('#faf5ff')    # Fond lavande très clair
C_BORDER = colors.HexColor('#e9d5ff')      # Bordure subtile
C_TEXT_MAIN = colors.HexColor('#0f172a')   # Texte sombre presque noir
C_TEXT_MUTED = colors.HexColor('#475569')  # Texte secondaire gris ardoise
C_ACCENT = colors.HexColor('#a855f7')      # Accent clair
C_WHITE = colors.white
C_CARD_BG = colors.HexColor('#f8fafc')     # Fond cartes projet

def prepare_circular_photo(source_path, dest_path, size_px=400):
    """Crée une photo de profil détourée en cercle parfait."""
    try:
        if not os.path.exists(source_path):
            return False
        img = Image.open(source_path).convert("RGBA")
        img = ImageOps.fit(img, (size_px, size_px), Image.Resampling.LANCZOS)
        mask = Image.new("L", (size_px, size_px), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size_px, size_px), fill=255)
        output = Image.new("RGBA", (size_px, size_px), (0, 0, 0, 0))
        output.paste(img, (0, 0), mask=mask)
        output.save(dest_path, format="PNG")
        return True
    except Exception as e:
        print(f"Erreur préparation photo: {e}", file=sys.stderr)
        return False

def draw_header_page1(c, photo_path):
    """Bandeau supérieur de la page 1 avec nom, titre et badge."""
    # Fond dégradé simulé
    c.setFillColor(C_PRIMARY)
    c.rect(0, PAGE_H - 125, PAGE_W, 125, fill=1, stroke=0)
    
    # Accent subtil
    c.setFillColor(C_DARK)
    c.rect(0, PAGE_H - 125, PAGE_W, 4, fill=1, stroke=0)

    # Photo circulaire
    photo_x = 32
    photo_y = PAGE_H - 110
    photo_size = 92
    
    if os.path.exists(photo_path):
        # Cercle blanc extérieur
        c.setFillColor(C_WHITE)
        c.circle(photo_x + photo_size/2, photo_y + photo_size/2, (photo_size/2) + 3, fill=1, stroke=0)
        c.drawImage(photo_path, photo_x, photo_y, width=photo_size, height=photo_size, mask='auto')
    else:
        # Fallback monogramme
        c.setFillColor(C_WHITE)
        c.circle(photo_x + photo_size/2, photo_y + photo_size/2, photo_size/2, fill=1, stroke=0)
        c.setFillColor(C_PRIMARY)
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(photo_x + photo_size/2, photo_y + photo_size/2 - 11, "PH")

    # Nom et Prénom
    text_x = 142
    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(text_x, PAGE_H - 52, "HOUNTONDJI PHILIPPE")

    # Titre professionnel
    c.setFillColor(colors.HexColor('#f3e8ff'))
    c.setFont("Helvetica-Bold", 12.5)
    c.drawString(text_x, PAGE_H - 72, "DÉVELOPPEUR WEB FULL-STACK & ADMINISTRATEUR RÉSEAU")

    # Sous-titre / Spécialités
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor('#e9d5ff'))
    c.drawString(text_x, PAGE_H - 89, "Bénin (Porto-Novo & Cotonou) • Étudiant L3 ENEAM • Laravel · React · Node.js · Flutter · Cisco IOS")

    # Badge de disponibilité
    c.setFillColor(colors.HexColor('#10b981'))
    c.circle(text_x + 6, PAGE_H - 105, 3.5, fill=1, stroke=0)
    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(text_x + 14, PAGE_H - 108, "DISPONIBLE POUR MISSIONS & STAGES • OUVERT À L'INTERNATIONAL")

def draw_section_title(c, x, y, title, width, icon=""):
    """Titre de section avec ligne violette sous-jacente."""
    c.setFillColor(C_PRIMARY)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(x, y, title)
    
    # Ligne de séparation élégante
    line_y = y - 3
    c.setStrokeColor(C_PRIMARY)
    c.setLineWidth(1.2)
    c.line(x, line_y, x + width, line_y)

def draw_bullet(c, x, y):
    """Dessine une puce violette."""
    c.setFillColor(C_PRIMARY)
    c.circle(x, y, 1.8, fill=1, stroke=0)

def draw_page1(c, photo_path):
    """Page 1 complète et équilibrée."""
    draw_header_page1(c, photo_path)

    left_x = 30
    left_w = 155
    right_x = 205
    right_w = 360

    # Ligne verticale de séparation entre colonnes
    c.setStrokeColor(colors.HexColor('#f1f5f9'))
    c.setLineWidth(1)
    c.line(195, 35, 195, PAGE_H - 145)

    # ══════════════════════════════════════════════
    # COLONNE GAUCHE (Infos, Profil, Compétences, Langues, Qualités)
    # ══════════════════════════════════════════════
    y_left = PAGE_H - 150

    # 1. COORDONNÉES
    draw_section_title(c, left_x, y_left, "COORDONNÉES", left_w)
    y_left -= 16
    contacts = [
        ("Localisation", "Porto-Novo, Bénin"),
        ("Email", "hountondjiphilippe58@gmail.com"),
        ("Téléphone", "+229 01 58 15 69 30"),
        ("WhatsApp", "+229 58 15 69 30"),
        ("GitHub", "github.com/hountondji-philippe"),
        ("LinkedIn", "linkedin.com/in/philippe-hountondji"),
    ]
    for label, val in contacts:
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(C_TEXT_MAIN)
        c.drawString(left_x, y_left, label)
        y_left -= 9
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_x, y_left, val)
        y_left -= 11

    y_left -= 6

    # 2. PROFIL & SYNTHÈSE
    draw_section_title(c, left_x, y_left, "PROFIL & VISION", left_w)
    y_left -= 15
    profil_text = (
        "Double profil rare combinant l'ingénierie logicielle full-stack moderne "
        "et la maîtrise avancée des réseaux Cisco. Passionné par la sécurité des "
        "systèmes, l'architecture propre (SOLID) et la haute disponibilité."
    )
    style = ParagraphStyle(
        'ProfilStyle',
        fontName='Helvetica',
        fontSize=7.6,
        leading=10.5,
        textColor=C_TEXT_MUTED
    )
    p = Paragraph(profil_text, style)
    w, h = p.wrap(left_w, 200)
    p.drawOn(c, left_x, y_left - h + 8)
    y_left -= (h + 12)

    # 3. COMPÉTENCES CLÉS
    draw_section_title(c, left_x, y_left, "COMPÉTENCES CLÉS", left_w)
    y_left -= 15

    skills_groups = [
        ("Web Full-Stack", "Laravel, React, Node.js, PHP, Tailwind CSS, TypeScript"),
        ("Mobile", "Flutter, Dart (Android & iOS)"),
        ("Réseaux & Infra", "Cisco IOS, Routage OSPF, VLAN 802.1Q, NAT, STP, Linux"),
        ("Bases de données", "PostgreSQL, MySQL, Prisma ORM, Redis"),
        ("DevOps & Outils", "Git, Docker, CI/CD, Postman, Wireshark, Figma"),
        ("Cybersécurité", "Durcissement Linux, OWASP Top 10, Hash/HMAC, Pare-feu"),
    ]
    for domain, tools in skills_groups:
        c.setFont("Helvetica-Bold", 7.8)
        c.setFillColor(C_PRIMARY)
        c.drawString(left_x, y_left, f"• {domain}")
        y_left -= 9.5
        c.setFont("Helvetica", 7.2)
        c.setFillColor(C_TEXT_MUTED)
        
        p_tools = Paragraph(tools, ParagraphStyle('TS', fontName='Helvetica', fontSize=7.2, leading=9.5, textColor=C_TEXT_MUTED))
        pw, ph = p_tools.wrap(left_w - 4, 100)
        p_tools.drawOn(c, left_x + 4, y_left - ph + 8)
        y_left -= (ph + 5)

    y_left -= 4

    # 4. LANGUES
    draw_section_title(c, left_x, y_left, "LANGUES", left_w)
    y_left -= 14
    langues = [
        ("Français", "Langue maternelle / Courant"),
        ("Anglais", "Intermédiaire — Lu, écrit, technique"),
        ("Gun", "Courant"),
    ]
    for lang, level in langues:
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(C_TEXT_MAIN)
        c.drawString(left_x, y_left, lang)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_x + 50, y_left, f"— {level}")
        y_left -= 11

    y_left -= 4

    # 5. ATOUTS & SOFT SKILLS
    draw_section_title(c, left_x, y_left, "QUALITÉS & ATOUTS", left_w)
    y_left -= 14
    atouts = [
        "Rigueur méthodologique & Clean Code",
        "Résolution rapide d'incidents complexes",
        "Sens du travail en équipe et esprit agile",
        "Veille technologique active continue",
    ]
    for a in atouts:
        draw_bullet(c, left_x + 2, y_left + 2.5)
        c.setFont("Helvetica", 7.4)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_x + 9, y_left, a)
        y_left -= 10.5

    # ══════════════════════════════════════════════
    # COLONNE DROITE (Expériences professionnelles & Formations)
    # ══════════════════════════════════════════════
    y_right = PAGE_H - 150

    # 1. EXPÉRIENCES PROFESSIONNELLES
    draw_section_title(c, right_x, y_right, "EXPÉRIENCES PROFESSIONNELLES", right_w)
    y_right -= 18

    exps = [
        {
            "poste": "Stage Développeur Web Full-Stack",
            "contexte": "NextMux, Bénin | Juin 2026 — Présent (Temps plein)",
            "puces": [
                "Conception et développement d'applications web full-stack d'entreprise avec Laravel et React.",
                "Création et sécurisation d'APIs REST performantes (authentification Sanctum, validation stricte).",
                "Modélisation et optimisation de bases de données relationnelles MySQL et PostgreSQL.",
                "Déploiement continu, tests d'intégration et respect des normes de sécurité informatique OWASP.",
            ]
        },
        {
            "poste": "Développeur Full-Stack & Administrateur Réseau Indépendant",
            "contexte": "Porto-Novo & Cotonou, Bénin | 2024 — Présent",
            "puces": [
                "Développement de la plateforme citoyenne sécurisée VBG Bénin avec chiffrement de bout en bout.",
                "Création de la plateforme de gestion de stagiaires Stamux (Internship OS) avec génération de bilans PDF.",
                "Conception et déploiement de l'application de commandes en temps réel RestoDirect.",
                "Mise en œuvre d'infrastructures réseaux : segmentation VLAN, routage inter-VLAN et politiques de sécurité.",
            ]
        },
        {
            "poste": "Technicien Systèmes & Support Réseau (Missions ponctuelles)",
            "contexte": "Bénin | 2023 — 2024",
            "puces": [
                "Installation, configuration et durcissement de serveurs Linux (Debian, Ubuntu) et Windows Server.",
                "Diagnostic de connectivité réseau, câblage structuré RJ45 et configuration de commutateurs.",
                "Maintenance préventive et corrective du parc informatique et assistance aux utilisateurs.",
            ]
        }
    ]

    for exp in exps:
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(C_PRIMARY)
        c.drawString(right_x, y_right, exp["poste"])
        y_right -= 11

        c.setFont("Helvetica-Bold", 7.8)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(right_x, y_right, exp["contexte"])
        y_right -= 12

        for p in exp["puces"]:
            draw_bullet(c, right_x + 4, y_right + 2.5)
            c.setFont("Helvetica", 7.8)
            c.setFillColor(C_TEXT_MAIN)
            
            p_obj = Paragraph(p, ParagraphStyle('EP', fontName='Helvetica', fontSize=7.8, leading=10.2, textColor=C_TEXT_MAIN))
            pw, ph = p_obj.wrap(right_w - 14, 100)
            p_obj.drawOn(c, right_x + 12, y_right - ph + 8)
            y_right -= (ph + 3.5)

        y_right -= 8

    y_right -= 4

    # 2. FORMATIONS ACADÉMIQUES
    draw_section_title(c, right_x, y_right, "FORMATIONS ACADÉMIQUES", right_w)
    y_right -= 18

    formations = [
        {
            "titre": "Licence en Informatique de Gestion — Spécialité Réseaux & Systèmes (L3 en cours)",
            "etab": "ENEAM, Université d'Abomey-Calavi (UAC), Cotonou | 2025 — Présent",
            "desc": "Approfondissement : Administration réseau Cisco (CCNA), routage dynamique, virtualisation, cybersécurité, systèmes d'exploitation Linux avancé, gestion de projets informatiques."
        },
        {
            "titre": "Licence 2 — Informatique de Gestion (Validée)",
            "etab": "ENEAM, Université d'Abomey-Calavi (UAC), Cotonou | 2025 — 2026",
            "desc": "Conception logicielle orientée objet, modélisation UML, bases de données avancées (SQL/PostgreSQL), architecture des ordinateurs et interconnexion des réseaux."
        },
        {
            "titre": "Licence 1 — Informatique de Gestion (Validée avec succès)",
            "etab": "ENEAM, Université d'Abomey-Calavi (UAC), Cotonou | 2024 — 2025",
            "desc": "Fondamentaux : Algorithmique, structures de données, programmation en C/Java, mathématiques appliquées, introduction aux réseaux locaux et systèmes d'information."
        },
        {
            "titre": "Baccalauréat Scientifique",
            "etab": "CEG Danto, Porto-Novo, Bénin | 2024",
            "desc": "Série Scientifique — Solides bases analytiques, rigueur logique et mathématique."
        }
    ]

    for f in formations:
        c.setFont("Helvetica-Bold", 8.8)
        c.setFillColor(C_PRIMARY)
        c.drawString(right_x, y_right, f["titre"])
        y_right -= 10.5

        c.setFont("Helvetica-Bold", 7.6)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(right_x, y_right, f["etab"])
        y_right -= 10

        p_desc = Paragraph(f["desc"], ParagraphStyle('FD', fontName='Helvetica', fontSize=7.4, leading=9.8, textColor=C_TEXT_MAIN))
        pw, ph = p_desc.wrap(right_w - 6, 100)
        p_desc.drawOn(c, right_x + 4, y_right - ph + 8)
        y_right -= (ph + 7)

    # ══════════════════════════════════════════════
    # PIED DE PAGE
    # ══════════════════════════════════════════════
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(0.8)
    c.line(30, 28, PAGE_W - 30, 28)

    c.setFont("Helvetica", 7.2)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(30, 18, "Hountondji Philippe — Curriculum Vitae Développeur Full-Stack & Administrateur Réseau")
    c.drawRightString(PAGE_W - 30, 18, "Page 1 / 2")

def draw_header_page2(c):
    """Bandeau supérieur de la page 2 avec rappel du candidat et contacts."""
    c.setFillColor(C_PRIMARY)
    c.rect(0, PAGE_H - 65, PAGE_W, 65, fill=1, stroke=0)

    c.setFillColor(C_DARK)
    c.rect(0, PAGE_H - 65, PAGE_W, 3, fill=1, stroke=0)

    # Nom et titre à gauche
    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(30, PAGE_H - 32, "HOUNTONDJI PHILIPPE")

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor('#e9d5ff'))
    c.drawString(30, PAGE_H - 48, "PROJETS PHARES & RÉALISATIONS TECHNIQUES")

    # Coordonnées de rappel à droite
    c.drawRightString(PAGE_W - 30, PAGE_H - 28, "Porto-Novo, Bénin • +229 01 58 15 69 30")
    c.drawRightString(PAGE_W - 30, PAGE_H - 42, "hountondjiphilippe58@gmail.com")
    c.drawRightString(PAGE_W - 30, PAGE_H - 54, "github.com/hountondji-philippe")

def draw_project_card(c, x, y, w, h, titre, badge, techs, desc, liens=""):
    """Carte projet stylisée avec bordure gauche violette et contenu bien dosé."""
    # Fond
    c.setFillColor(C_CARD_BG)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=0)

    # Bordure globale subtile
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, 4, fill=0, stroke=1)

    # Bordure gauche violette accent
    c.setFillColor(C_PRIMARY)
    c.rect(x, y, 3.5, h, fill=1, stroke=0)

    inner_x = x + 9
    inner_w = w - 16
    curr_y = y + h - 14

    # Titre et Badge
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(C_PRIMARY)
    c.drawString(inner_x, curr_y, titre)

    # Badge type
    badge_w = c.stringWidth(badge, "Helvetica-Bold", 6.5) + 8
    badge_x = x + w - badge_w - 6
    c.setFillColor(colors.HexColor('#ede9fe'))
    c.roundRect(badge_x, curr_y - 2, badge_w, 10, 3, fill=1, stroke=0)
    c.setFillColor(C_PRIMARY)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(badge_x + 4, curr_y + 0.5, badge)

    curr_y -= 12

    # Technologies
    c.setFont("Helvetica-Bold", 7.2)
    c.setFillColor(colors.HexColor('#0284c7'))
    c.drawString(inner_x, curr_y, techs)

    curr_y -= 10

    # Description
    p_desc = Paragraph(desc, ParagraphStyle('PD', fontName='Helvetica', fontSize=7.2, leading=9.5, textColor=C_TEXT_MAIN))
    pw, ph = p_desc.wrap(inner_w, 100)
    p_desc.drawOn(c, inner_x, curr_y - ph + 7)

    # Liens
    if liens:
        c.setFont("Helvetica-Bold", 6.8)
        c.setFillColor(C_PRIMARY)
        c.drawString(inner_x, y + 6, liens)

def draw_page2(c):
    """Page 2 : Projets complets et approfondissement technique équilibré."""
    draw_header_page2(c)

    start_y = PAGE_H - 85
    card_w = 260
    card_h = 88
    col1_x = 30
    col2_x = 305

    # 1. SECTION PROJETS
    draw_section_title(c, 30, start_y, "PROJETS PHARES & RÉALISATIONS D'INGÉNIERIE", PAGE_W - 60)
    start_y -= 18

    # 6 Projets complets bien équilibrés
    projets = [
        {
            "titre": "Stamux — Internship OS",
            "badge": "PROFESSIONNEL",
            "techs": "Laravel 12 · Sanctum · DomPDF · React · MySQL",
            "desc": "Plateforme complète de gestion de stagiaires avec architecture multicouche (SOLID). Rôles Admin/Tuteur/Stagiaire, 68 routes API sécurisées, génération automatisée de bilans et conventions de stage en PDF.",
            "liens": "Démo en ligne • Dépôt GitHub disponible"
        },
        {
            "titre": "Simulation Réseau Campus Multi-Sites",
            "badge": "ACADÉMIQUE / RÉSEAU",
            "techs": "Cisco IOS · OSPF Multi-Area · VLANs 802.1Q · ACLs",
            "desc": "Architecture réseau campus simulant 3 bâtiments avec redondance de liens. Routage dynamique OSPF, segmentation en 4 VLANs, sécurisation par listes de contrôle d'accès (ACLs étendues) et NAT/PAT.",
            "liens": "Schéma Packet Tracer • Documentation Cisco"
        },
        {
            "titre": "RestoDirect — Commande & Livraison",
            "badge": "PROFESSIONNEL",
            "techs": "Next.js · Prisma · PostgreSQL · WebSockets · Tailwind",
            "desc": "Application web temps réel de commande pour restaurants d'Afrique de l'Ouest. Mises à jour en direct cuisine-livreur, géolocalisation Leaflet, paiement mobile et tableaux de bord analytics.",
            "liens": "Démo interactive • GitHub"
        },
        {
            "titre": "Plateforme Citoyenne VBG Bénin",
            "badge": "IMPACT SOCIAL",
            "techs": "Node.js · Express · Chiffrement AES-256 · Leaflet",
            "desc": "Système de signalement 100% anonyme et sécurisé contre les violences basées sur le genre. Chiffrement des dépositions, cartographie anonymisée des zones d'alerte et interface réactive adaptée mobile.",
            "liens": "Projet d'utilité publique • GitHub"
        },
        {
            "titre": "Mémoire+ — Gestion Académique ENEAM",
            "badge": "ACADÉMIQUE",
            "techs": "Laravel · React · MySQL · Workflow de Validation",
            "desc": "Solution de dépôt, contrôle de conformité et archivage des mémoires de fin de cycle universitaire. Workflow à double validation tuteur/jury et moteur de recherche plein texte par filière.",
            "liens": "Démo académique • GitHub"
        },
        {
            "titre": "Portfolio Cyberpunk & Lab Cybersécurité",
            "badge": "PERSONNEL",
            "techs": "JavaScript ES6+ · Vercel Functions · JWT · CSRF HMAC",
            "desc": "Vitrine d'ingénierie moderne sans framework lourd : terminal interactif Cisco, PWA hors-ligne, audit de sécurité OWASP (en-têtes stricts, CSP, validation cryptographique de tokens, zéro faille).",
            "liens": "portfolio-seven-delta-21jq5u35et.vercel.app"
        }
    ]

    # Disposition en grille 2 colonnes x 3 lignes
    row_y = start_y
    for i in range(0, len(projets), 2):
        p1 = projets[i]
        draw_project_card(c, col1_x, row_y - card_h, card_w, card_h, p1["titre"], p1["badge"], p1["techs"], p1["desc"], p1["liens"])
        
        if i + 1 < len(projets):
            p2 = projets[i + 1]
            draw_project_card(c, col2_x, row_y - card_h, card_w, card_h, p2["titre"], p2["badge"], p2["techs"], p2["desc"], p2["liens"])

        row_y -= (card_h + 10)

    # 2. APPROFONDISSEMENT TECHNIQUE & PROTOCOLES
    y_tech = row_y - 6
    draw_section_title(c, 30, y_tech, "MAÎTRISE DES INFRASTRUCTURES RÉSEAU & PROTOCOLES CISCO", PAGE_W - 60)
    y_tech -= 18

    # Encadré Réseau
    c.setFillColor(colors.HexColor('#faf5ff'))
    c.roundRect(30, y_tech - 75, PAGE_W - 60, 75, 4, fill=1, stroke=0)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(30, y_tech - 75, PAGE_W - 60, 75, 4, fill=0, stroke=1)

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(C_PRIMARY)
    c.drawString(42, y_tech - 14, "• Routage & Commutation :")
    c.drawString(42, y_tech - 32, "• Sécurité & Contrôle d'accès :")
    c.drawString(42, y_tech - 50, "• Services & Supervision :")
    c.drawString(42, y_tech - 68, "• Systèmes d'exploitation :")

    c.setFont("Helvetica", 7.8)
    c.setFillColor(C_TEXT_MAIN)
    c.drawString(180, y_tech - 14, "OSPFv2/v3, Routage Statique, VLANs (802.1Q), Inter-VLAN Routing, STP/RSTP, EtherChannel")
    c.drawString(180, y_tech - 32, "ACLs Standard & Étendues, Port Security, DHCP Snooping, Dynamic ARP Inspection, Pare-feu")
    c.drawString(180, y_tech - 50, "DHCP, DNS, NAT/PAT, SSHv2, NTP, SNMP, Analyse de trames via Wireshark")
    c.drawString(180, y_tech - 68, "Linux Debian, Ubuntu Server (systemd, iptables, ufw, Nginx, Apache), Windows Server 2022")

    # 3. MÉTHODOLOGIE & STANDARDS LOGICIELS
    y_meth = y_tech - 95
    draw_section_title(c, 30, y_meth, "MÉTHODOLOGIE LOGICIELLE & STANDARDS INDUSTRIELS", PAGE_W - 60)
    y_meth -= 18

    # Encadré Méthodologie
    c.setFillColor(colors.HexColor('#f8fafc'))
    c.roundRect(30, y_meth - 65, PAGE_W - 60, 65, 4, fill=1, stroke=0)
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(0.8)
    c.roundRect(30, y_meth - 65, PAGE_W - 60, 65, 4, fill=0, stroke=1)

    methodes = [
        ("Architecture logicielle :", "Principes SOLID, Clean Architecture, Design Patterns (Repository, Factory), Modularité."),
        ("Sécurité applicative :", "Protection contre les failles OWASP Top 10 (CSRF, XSS, Injections SQL/NoSQL, Rate Limiting)."),
        ("Gestion de versions & CI :", "Git Flow rigoureux, commits conventionnels, revues de code, automatisation GitHub Actions."),
        ("Méthodologie de travail :", "Agile / Scrum, autonomie démontrée, rédaction de documentations techniques exhaustives."),
    ]
    my = y_meth - 14
    for label, desc in methodes:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(C_PRIMARY)
        c.drawString(42, my, label)
        c.setFont("Helvetica", 7.8)
        c.setFillColor(C_TEXT_MAIN)
        c.drawString(175, my, desc)
        my -= 14

    # ══════════════════════════════════════════════
    # PIED DE PAGE
    # ══════════════════════════════════════════════
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(0.8)
    c.line(30, 28, PAGE_W - 30, 28)

    c.setFont("Helvetica", 7.2)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(30, 18, "Hountondji Philippe — Curriculum Vitae Développeur Full-Stack & Administrateur Réseau")
    c.drawRightString(PAGE_W - 30, 18, "Page 2 / 2")

def generate_cv_pdf(output_path, photo_src):
    """Génère le PDF vectoriel sur 2 pages."""
    temp_photo = "temp_philippe_circ.png"
    has_photo = prepare_circular_photo(photo_src, temp_photo, size_px=400)
    photo_to_use = temp_photo if has_photo else photo_src

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle("CV — Philippe Hountondji | Développeur Full-Stack & Administrateur Réseau")
    c.setAuthor("Philippe Hountondji")
    c.setSubject("Curriculum Vitae professionnel de Philippe Hountondji")
    c.setKeywords(["Philippe Hountondji", "Développeur Full-Stack", "Administrateur Réseau", "Laravel", "React", "Cisco", "ENEAM", "Bénin"])

    # Page 1
    draw_page1(c, photo_to_use)
    c.showPage()

    # Page 2
    draw_page2(c)
    c.showPage()

    c.save()

    if os.path.exists(temp_photo):
        try:
            os.remove(temp_photo)
        except:
            pass

    print(f"[OK] CV PDF généré avec succès : {output_path}")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    photo_file = os.path.join(base_dir, "public", "images", "philippe.jpeg")
    
    out1 = os.path.join(base_dir, "public", "assets", "CV_Philippe_Hountondji.pdf")
    out2 = os.path.join(base_dir, "public", "CV_Philippe_Hountondji.pdf")

    os.makedirs(os.path.dirname(out1), exist_ok=True)

    generate_cv_pdf(out1, photo_file)
    generate_cv_pdf(out2, photo_file)
