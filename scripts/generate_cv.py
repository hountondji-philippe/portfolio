#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Générateur de CV Haute Fidélité — Philippe Hountondji (Version 2.1 Révisée)
Document PDF vectoriel A4 (2 pages) strictement aligné avec les demandes de Philippe :
- Suppression badge disponibilité dans le header
- Regroupement des licences en un seul bloc et suppression du Baccalauréat
- Anglais : Débutant
- Suppression Cybersécurité et Postman des compétences clés
- Vrais liens directs pour chaque projet (pas de "Démo en ligne")
- Suppression Sécurité & Contrôle d'accès des infrastructures Cisco
- Suppression Sécurité applicative et Architecture logicielle de la méthodologie
- Transfert de la section Infrastructures Réseau sur la Page 1 pour un équilibre parfait des deux pages
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from PIL import Image, ImageDraw, ImageOps

PAGE_W, PAGE_H = A4  # 595.27 x 841.89 points

# Couleurs du Portfolio Cyberpunk
C_PRIMARY = colors.HexColor('#7c3aed')     # Violet principal
C_DARK = colors.HexColor('#581c87')        # Violet profond
C_TEXT_MAIN = colors.HexColor('#0f172a')   # Texte sombre franc
C_TEXT_MUTED = colors.HexColor('#475569')  # Gris ardoise secondaire
C_BORDER = colors.HexColor('#e2e8f0')      # Bordure neutre
C_CARD_BG = colors.HexColor('#f8fafc')     # Fond cartes projet
C_WHITE = colors.white

def prepare_circular_photo(source_path, dest_path, size_px=400):
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

def draw_section_title(c, x, y, title, width):
    c.setFillColor(C_PRIMARY)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(x, y, title)
    line_y = y - 3
    c.setStrokeColor(C_PRIMARY)
    c.setLineWidth(1.2)
    c.line(x, line_y, x + width, line_y)

def draw_bullet(c, x, y):
    c.setFillColor(C_PRIMARY)
    c.circle(x, y, 1.8, fill=1, stroke=0)

# ══════════════════════════════════════════════════════════════════════
# PAGE 1
# ══════════════════════════════════════════════════════════════════════
def draw_header_page1(c, photo_path):
    # Bandeau violet supérieur (hauteur adaptée sans le badge de disponibilité)
    header_h = 108
    c.setFillColor(C_PRIMARY)
    c.rect(0, PAGE_H - header_h, PAGE_W, header_h, fill=1, stroke=0)
    c.setFillColor(C_DARK)
    c.rect(0, PAGE_H - header_h, PAGE_W, 3.5, fill=1, stroke=0)

    # Photo circulaire
    photo_x = 32
    photo_y = PAGE_H - 96
    photo_size = 82
    
    if os.path.exists(photo_path):
        c.setFillColor(C_WHITE)
        c.circle(photo_x + photo_size/2, photo_y + photo_size/2, (photo_size/2) + 2.5, fill=1, stroke=0)
        c.drawImage(photo_path, photo_x, photo_y, width=photo_size, height=photo_size, mask='auto')
    else:
        c.setFillColor(C_WHITE)
        c.circle(photo_x + photo_size/2, photo_y + photo_size/2, photo_size/2, fill=1, stroke=0)
        c.setFillColor(C_PRIMARY)
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(photo_x + photo_size/2, photo_y + photo_size/2 - 10, "PH")

    # Titres candidat
    text_x = 130
    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(text_x, PAGE_H - 46, "HOUNTONDJI PHILIPPE")

    c.setFillColor(colors.HexColor('#f3e8ff'))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(text_x, PAGE_H - 66, "DÉVELOPPEUR WEB FULL-STACK & ADMINISTRATEUR RÉSEAU")

    c.setFont("Helvetica", 8.8)
    c.setFillColor(colors.HexColor('#e9d5ff'))
    c.drawString(text_x, PAGE_H - 83, "Bénin (Porto-Novo & Cotonou) • Étudiant L3 ENEAM • Laravel · React · Node.js · Flutter · Cisco IOS")

def draw_page1(c, photo_path):
    draw_header_page1(c, photo_path)

    left_x = 30
    left_w = 155
    right_x = 205
    right_w = 360

    # Ligne verticale de séparation
    c.setStrokeColor(colors.HexColor('#f1f5f9'))
    c.setLineWidth(1)
    c.line(195, 35, 195, PAGE_H - 120)

    # ──────────────────────────────────────────────
    # COLONNE GAUCHE
    # ──────────────────────────────────────────────
    y_left = PAGE_H - 130

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

    # 2. PROFIL & VISION
    draw_section_title(c, left_x, y_left, "PROFIL & VISION", left_w)
    y_left -= 15
    profil_text = (
        "Double profil rare combinant l'ingénierie logicielle full-stack moderne "
        "et la maîtrise approfondie des réseaux d'entreprise Cisco. Passionné par "
        "les architectures performantes, les applications réactives et la résilience "
        "des infrastructures."
    )
    p = Paragraph(profil_text, ParagraphStyle('Profil', fontName='Helvetica', fontSize=7.6, leading=10.5, textColor=C_TEXT_MUTED))
    w, h = p.wrap(left_w, 200)
    p.drawOn(c, left_x, y_left - h + 8)
    y_left -= (h + 14)

    # 3. COMPÉTENCES CLÉS (Cybersécurité retirée, Postman retiré)
    draw_section_title(c, left_x, y_left, "COMPÉTENCES CLÉS", left_w)
    y_left -= 15

    skills_groups = [
        ("Web Full-Stack", "Laravel, React, Node.js, PHP, Tailwind CSS, TypeScript"),
        ("Mobile", "Flutter, Dart (Android & iOS)"),
        ("Réseaux & Infra", "Cisco IOS, Routage OSPF, VLAN 802.1Q, NAT, STP, Linux"),
        ("Bases de données", "PostgreSQL, MySQL, Prisma ORM, Redis"),
        ("DevOps & Outils", "Git, Docker, CI/CD, Wireshark, Figma"),
    ]
    for domain, tools in skills_groups:
        c.setFont("Helvetica-Bold", 7.8)
        c.setFillColor(C_PRIMARY)
        c.drawString(left_x, y_left, f"• {domain}")
        y_left -= 9.5
        
        p_tools = Paragraph(tools, ParagraphStyle('Tools', fontName='Helvetica', fontSize=7.2, leading=9.5, textColor=C_TEXT_MUTED))
        pw, ph = p_tools.wrap(left_w - 4, 100)
        p_tools.drawOn(c, left_x + 4, y_left - ph + 8)
        y_left -= (ph + 5)

    y_left -= 6

    # 4. LANGUES (Anglais débutant)
    draw_section_title(c, left_x, y_left, "LANGUES", left_w)
    y_left -= 14
    langues = [
        ("Français", "Langue maternelle / Courant"),
        ("Anglais", "Débutant"),
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

    y_left -= 6

    # 5. QUALITÉS & ATOUTS
    draw_section_title(c, left_x, y_left, "QUALITÉS & ATOUTS", left_w)
    y_left -= 14
    atouts = [
        "Rigueur d'analyse et sens du détail",
        "Autonomie et résolution proactive",
        "Esprit d'équipe et communication claire",
        "Veille technologique active continue",
    ]
    for a in atouts:
        draw_bullet(c, left_x + 2, y_left + 2.5)
        c.setFont("Helvetica", 7.4)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_x + 9, y_left, a)
        y_left -= 11

    # ──────────────────────────────────────────────
    # COLONNE DROITE
    # ──────────────────────────────────────────────
    y_right = PAGE_H - 130

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
                "Déploiement continu, tests d'intégration et respect des bonnes pratiques logicielles.",
            ]
        },
        {
            "poste": "Développeur Full-Stack & Administrateur Réseau Indépendant",
            "contexte": "Porto-Novo & Cotonou, Bénin | 2024 — Présent",
            "puces": [
                "Développement de la plateforme citoyenne sécurisée VBG Bénin avec cartographie Leaflet.",
                "Création de la plateforme de gestion de stagiaires Stamux (Internship OS) avec génération PDF.",
                "Conception et déploiement de l'application de commande en temps réel RestoDirect.",
                "Mise en œuvre d'infrastructures réseaux : segmentation VLAN, routage et interconnexions.",
            ]
        },
        {
            "poste": "Technicien Systèmes & Support Réseau (Missions ponctuelles)",
            "contexte": "Bénin | 2023 — 2024",
            "puces": [
                "Installation, configuration et maintenance de serveurs Linux (Debian, Ubuntu) et Windows Server.",
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
            y_right -= (ph + 3)

        y_right -= 7

    y_right -= 2

    # 2. FORMATIONS ACADÉMIQUES (Bloc unifié complet — Baccalauréat retiré)
    draw_section_title(c, right_x, y_right, "FORMATION ACADÉMIQUE", right_w)
    y_right -= 18

    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(C_PRIMARY)
    c.drawString(right_x, y_right, "Licence en Informatique de Gestion — Spécialité Réseaux & Systèmes")
    y_right -= 11

    c.setFont("Helvetica-Bold", 7.8)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(right_x, y_right, "ENEAM, Université d'Abomey-Calavi (UAC), Cotonou | 2024 — Présent (L3 en cours, L1 & L2 validées)")
    y_right -= 11

    desc_form = (
        "Cursus universitaire d'excellence alliant génie logiciel et infrastructures : administration réseau Cisco (CCNA), "
        "routage dynamique OSPF, segmentation VLAN, virtualisation, systèmes d'exploitation Linux avancé, modélisation "
        "de bases de données relationnelles (SQL, PostgreSQL) et conception d'applications d'entreprise."
    )
    p_form = Paragraph(desc_form, ParagraphStyle('Form', fontName='Helvetica', fontSize=7.6, leading=10.2, textColor=C_TEXT_MAIN))
    pw, ph = p_form.wrap(right_w - 6, 120)
    p_form.drawOn(c, right_x + 4, y_right - ph + 8)
    y_right -= (ph + 14)

    # 3. MAÎTRISE DES INFRASTRUCTURES RÉSEAU CISCO (Transférée sur Page 1 pour un équilibre parfait)
    draw_section_title(c, right_x, y_right, "MAÎTRISE DES INFRASTRUCTURES RÉSEAU CISCO", right_w)
    y_right -= 16

    c.setFillColor(colors.HexColor('#faf5ff'))
    c.roundRect(right_x, y_right - 62, right_w, 62, 4, fill=1, stroke=0)
    c.setStrokeColor(colors.HexColor('#e9d5ff'))
    c.setLineWidth(0.8)
    c.roundRect(right_x, y_right - 62, right_w, 62, 4, fill=0, stroke=1)

    c.setFont("Helvetica-Bold", 7.8)
    c.setFillColor(C_PRIMARY)
    c.drawString(right_x + 10, y_right - 14, "• Routage & Commutation :")
    c.drawString(right_x + 10, y_right - 32, "• Services & Supervision :")
    c.drawString(right_x + 10, y_right - 50, "• Systèmes d'exploitation :")

    c.setFont("Helvetica", 7.6)
    c.setFillColor(C_TEXT_MAIN)
    c.drawString(right_x + 130, y_right - 14, "OSPFv2/v3, Routage Statique, VLANs (802.1Q), Inter-VLAN, STP/RSTP, EtherChannel")
    c.drawString(right_x + 130, y_right - 32, "DHCP, DNS, NAT/PAT, SSHv2, NTP, SNMP, Analyse de paquets Wireshark")
    c.drawString(right_x + 130, y_right - 50, "Linux Debian, Ubuntu Server (systemd, Nginx, Apache), Windows Server 2022")

    # Pied de page
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.line(30, 26, PAGE_W - 30, 26)

    c.setFont("Helvetica", 7.2)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(30, 16, "Hountondji Philippe — Curriculum Vitae Développeur Full-Stack & Administrateur Réseau")
    c.drawRightString(PAGE_W - 30, 16, "Page 1 / 2")

# ══════════════════════════════════════════════════════════════════════
# PAGE 2
# ══════════════════════════════════════════════════════════════════════
def draw_header_page2(c):
    c.setFillColor(C_PRIMARY)
    c.rect(0, PAGE_H - 62, PAGE_W, 62, fill=1, stroke=0)
    c.setFillColor(C_DARK)
    c.rect(0, PAGE_H - 62, PAGE_W, 3, fill=1, stroke=0)

    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(30, PAGE_H - 30, "HOUNTONDJI PHILIPPE")

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor('#e9d5ff'))
    c.drawString(30, PAGE_H - 46, "PROJETS PHARES & RÉALISATIONS TECHNIQUES")

    c.drawRightString(PAGE_W - 30, PAGE_H - 26, "Porto-Novo, Bénin • +229 01 58 15 69 30")
    c.drawRightString(PAGE_W - 30, PAGE_H - 40, "hountondjiphilippe58@gmail.com")
    c.drawRightString(PAGE_W - 30, PAGE_H - 52, "github.com/hountondji-philippe")

def draw_project_card_page2(c, x, y, w, h, titre, badge, techs, desc, real_url):
    c.setFillColor(C_CARD_BG)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=0)

    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, 4, fill=0, stroke=1)

    c.setFillColor(C_PRIMARY)
    c.rect(x, y, 3.5, h, fill=1, stroke=0)

    inner_x = x + 9
    inner_w = w - 16
    curr_y = y + h - 14

    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(C_PRIMARY)
    c.drawString(inner_x, curr_y, titre)

    badge_w = c.stringWidth(badge, "Helvetica-Bold", 6.5) + 8
    badge_x = x + w - badge_w - 6
    c.setFillColor(colors.HexColor('#ede9fe'))
    c.roundRect(badge_x, curr_y - 2, badge_w, 10, 3, fill=1, stroke=0)
    c.setFillColor(C_PRIMARY)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(badge_x + 4, curr_y + 0.5, badge)

    curr_y -= 12

    c.setFont("Helvetica-Bold", 7.2)
    c.setFillColor(colors.HexColor('#0284c7'))
    c.drawString(inner_x, curr_y, techs)

    curr_y -= 10

    p_desc = Paragraph(desc, ParagraphStyle('PD2', fontName='Helvetica', fontSize=7.2, leading=9.6, textColor=C_TEXT_MAIN))
    pw, ph = p_desc.wrap(inner_w, 100)
    p_desc.drawOn(c, inner_x, curr_y - ph + 7)

    # VRAI LIEN DU PROJET
    if real_url:
        c.setFont("Helvetica-Bold", 6.8)
        c.setFillColor(C_PRIMARY)
        c.drawString(inner_x, y + 6, f"Lien : {real_url}")

def draw_page2(c):
    draw_header_page2(c)

    start_y = PAGE_H - 85
    card_w = 260
    card_h = 96
    col1_x = 30
    col2_x = 305

    draw_section_title(c, 30, start_y, "PROJETS PHARES & RÉALISATIONS D'INGÉNIERIE", PAGE_W - 60)
    start_y -= 18

    # 6 Projets complets avec leurs vrais liens uniques
    projets = [
        {
            "titre": "Stamux — Internship OS",
            "badge": "PROFESSIONNEL",
            "techs": "Laravel 12 · Sanctum · DomPDF · React · MySQL",
            "desc": "Plateforme complète de gestion de stagiaires avec architecture multicouche (SOLID). Rôles Admin/Tuteur/Stagiaire, 68 routes API sécurisées, génération automatisée de bilans et conventions de stage en PDF.",
            "url": "github.com/hountondji-philippe/stamux"
        },
        {
            "titre": "Simulation Réseau Campus Multi-Sites",
            "badge": "ACADÉMIQUE / RÉSEAU",
            "techs": "Cisco IOS · OSPF Multi-Area · VLANs 802.1Q · HSRP",
            "desc": "Architecture réseau campus simulant 3 bâtiments avec redondance de liens. Routage dynamique OSPF, segmentation en 4 VLANs, haute disponibilité de passerelle HSRP et plan d'adressage VLSM.",
            "url": "github.com/hountondji-philippe/cisco-campus-network"
        },
        {
            "titre": "RestoDirect — Commande & Livraison",
            "badge": "PROFESSIONNEL",
            "techs": "Next.js · Prisma · PostgreSQL · WebSockets · Tailwind",
            "desc": "Application web temps réel de commande pour restaurants. Mises à jour en direct cuisine-livreur par WebSockets, géolocalisation Leaflet, paiement mobile et tableaux de bord de gestion.",
            "url": "github.com/hountondji-philippe/restodirect"
        },
        {
            "titre": "Plateforme Citoyenne VBG Bénin",
            "badge": "IMPACT SOCIAL",
            "techs": "Node.js · Express · Chiffrement AES-256 · Leaflet",
            "desc": "Système de signalement 100% anonyme et sécurisé contre les violences basées sur le genre. Chiffrement des dépositions, cartographie anonymisée des zones d'alerte et interface réactive adaptée mobile.",
            "url": "github.com/hountondji-philippe/vbg-benin"
        },
        {
            "titre": "Mémoire+ — Gestion Académique ENEAM",
            "badge": "ACADÉMIQUE",
            "techs": "Laravel · React · MySQL · Workflow de Validation",
            "desc": "Solution de dépôt, contrôle de conformité et archivage des mémoires de fin de cycle universitaire. Workflow à double validation tuteur/jury et moteur de recherche plein texte par filière.",
            "url": "github.com/hountondji-philippe/memoire-plus"
        },
        {
            "titre": "Portfolio Cyberpunk & Lab Technique",
            "badge": "PERSONNEL",
            "techs": "JavaScript ES6+ · Vercel Functions · JWT · CSRF HMAC",
            "desc": "Vitrine d'ingénierie moderne sans framework lourd : terminal interactif Cisco, PWA hors-ligne, audit de sécurité OWASP (en-têtes stricts, CSP, validation cryptographique de tokens).",
            "url": "portfolio-seven-delta-21jq5u35et.vercel.app"
        }
    ]

    row_y = start_y
    for i in range(0, len(projets), 2):
        p1 = projets[i]
        draw_project_card_page2(c, col1_x, row_y - card_h, card_w, card_h, p1["titre"], p1["badge"], p1["techs"], p1["desc"], p1["url"])
        
        if i + 1 < len(projets):
            p2 = projets[i + 1]
            draw_project_card_page2(c, col2_x, row_y - card_h, card_w, card_h, p2["titre"], p2["badge"], p2["techs"], p2["desc"], p2["url"])

        row_y -= (card_h + 12)

    # MÉTHODOLOGIE LOGICIELLE & STANDARDS INDUSTRIELS (Épurée selon demandes)
    y_meth = row_y - 10
    draw_section_title(c, 30, y_meth, "MÉTHODOLOGIE LOGICIELLE & STANDARDS INDUSTRIELS", PAGE_W - 60)
    y_meth -= 18

    c.setFillColor(colors.HexColor('#f8fafc'))
    c.roundRect(30, y_meth - 70, PAGE_W - 60, 70, 4, fill=1, stroke=0)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(30, y_meth - 70, PAGE_W - 60, 70, 4, fill=0, stroke=1)

    methodes = [
        ("Gestion de versions & CI :", "Git Flow rigoureux, commits conventionnels, revues de code, automatisation GitHub Actions."),
        ("Méthodologie de travail :", "Agile / Scrum, autonomie démontrée, réunions de synchronisation, respect des délais de livraison."),
        ("Qualité logicielle & Clean Code :", "Lisibilité du code, découpage modulaire, refactorisation continue et tests fonctionnels."),
        ("Documentation technique :", "Rédaction de spécifications techniques claires, schémas d'architecture et guides de déploiement."),
    ]
    my = y_meth - 14
    for label, desc in methodes:
        c.setFont("Helvetica-Bold", 7.8)
        c.setFillColor(C_PRIMARY)
        c.drawString(42, my, label)
        c.setFont("Helvetica", 7.8)
        c.setFillColor(C_TEXT_MAIN)
        c.drawString(185, my, desc)
        my -= 14

    # Pied de page
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.line(30, 26, PAGE_W - 30, 26)

    c.setFont("Helvetica", 7.2)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(30, 16, "Hountondji Philippe — Curriculum Vitae Développeur Full-Stack & Administrateur Réseau")
    c.drawRightString(PAGE_W - 30, 16, "Page 2 / 2")

def generate_cv_pdf(output_path, photo_src):
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

    print(f"[OK] CV PDF généré : {output_path}")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    photo_file = os.path.join(base_dir, "public", "images", "philippe.jpeg")
    
    out1 = os.path.join(base_dir, "public", "assets", "CV_Philippe_Hountondji.pdf")
    out2 = os.path.join(base_dir, "public", "CV_Philippe_Hountondji.pdf")

    os.makedirs(os.path.dirname(out1), exist_ok=True)

    generate_cv_pdf(out1, photo_file)
    generate_cv_pdf(out2, photo_file)
