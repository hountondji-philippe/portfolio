#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Générateur de CV Haute Fidélité — Philippe Hountondji
Version Finale Épurée & Professionnelle :
1. PHILIPPE HOUNTONDJI sur UNE SEULE LIGNE dans la bannière supérieure
2. Bannière supérieure bleu profond (#003478) pleine largeur et épurée (suppression du cadre blanc bizarre derrière la photo)
3. Photo d'identité circulaire propre avec anneau blanc net, parfaitement intégrée dans l'en-tête
4. AUCUN texte coloré dans le corps : typographie suisse sobre (noir profond & gris neutres)
5. Page 2 : 6 cartes projets compactes, suppression totale du bloc "démarche environnementale / ingénierie"
6. Zéro débordement de texte : marges de sécurité rigoureuses (>30 pt)
"""

import os
import sys
import json
import urllib.request
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from PIL import Image, ImageDraw

PAGE_W, PAGE_H = A4  # 595.27 x 841.89 points

# ══════════════════════════════════════════════════════════════════════
# COULEURS CANVA & CORPS STRICTEMENT NEUTRE
# ══════════════════════════════════════════════════════════════════════
C_CANVA_BLUE = colors.HexColor('#003478')   # Bleu royal profond Canva (bannière supérieure)
C_WHITE      = colors.white

# Corps du document : AUCUN TEXTE COLORÉ (noir profond & gris neutres)
C_TEXT_BLACK = colors.HexColor('#0f172a')   # Noir profond / Anthracite pour titres & labels
C_TEXT_BODY  = colors.HexColor('#1e293b')   # Gris foncé pour descriptions & puces
C_TEXT_MUTED = colors.HexColor('#475569')   # Gris ardoise pour sous-titres & dates
C_BORDER     = colors.HexColor('#cbd5e1')   # Bordure neutre discrète
C_CARD_BG    = colors.HexColor('#ffffff')   # Fond blanc pur pour cartes
C_BOX_BG     = colors.HexColor('#f8fafc')   # Fond gris très clair pour encadrés


def prepare_circular_photo(source_path, dest_path, size_px=500):
    """
    Cadre centré harmonieusement sur le visage de Philippe (tête centrée avec espace au-dessus
    et buste équilibré), exactement comme sur le modèle Canva.
    Bbox tête réelle : x in [194, 292], y in [34, 173], centre tête: (243, 103).
    """
    try:
        if not os.path.exists(source_path):
            return False
        img = Image.open(source_path).convert("RGBA")
        w, h = img.size

        # Cadrage centré sur la tête et le haut des épaules
        if w > h:
            side = 210
            top = 14
            left = 138
            cropped = img.crop((left, top, left + side, top + side))
        else:
            side = min(w, h)
            left = (w - side) // 2
            cropped = img.crop((left, 0, left + side, side))

        cropped = cropped.resize((size_px, size_px), Image.Resampling.LANCZOS)

        mask = Image.new("L", (size_px, size_px), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size_px, size_px), fill=255)

        output = Image.new("RGBA", (size_px, size_px), (0, 0, 0, 0))
        output.paste(cropped, (0, 0), mask=mask)
        output.save(dest_path, format="PNG")
        return True
    except Exception as e:
        print(f"Erreur préparation photo: {e}", file=sys.stderr)
        return False


def draw_section_title(c, x, y, title):
    """Titre de section style Canva : majuscules grasses, NOIR STRICT."""
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(C_TEXT_BLACK)
    c.drawString(x, y, title)


def draw_bullet(c, x, y):
    """Puce ronde discrète en noir neutre."""
    c.setFillColor(C_TEXT_BLACK)
    c.circle(x, y, 1.8, fill=1, stroke=0)


# ══════════════════════════════════════════════════════════════════════
# PAGE 1 — MODÈLE ÉPURÉ (BANNIÈRE PLEINE SANS CADRE BLANC DERRIÈRE)
# ══════════════════════════════════════════════════════════════════════
def draw_page1(c, photo_path):
    # Bannière supérieure bleu profond pleine largeur (hauteur 114 pt)
    header_h = 114

    # 1. Bannière bleue supérieure pleine et nette
    c.setFillColor(C_CANVA_BLUE)
    c.rect(0, PAGE_H - header_h, PAGE_W, header_h, fill=1, stroke=0)

    # 2. PHOTO CIRCULAIRE PROPREMENT INTÉGRÉE DANS L'EN-TÊTE BLEU (SANS AUCUN CADRE BLANC DERRIÈRE)
    photo_size = 88
    photo_cx = 76
    photo_cy = PAGE_H - (header_h / 2.0)
    photo_x = photo_cx - photo_size / 2.0
    photo_y = photo_cy - photo_size / 2.0

    if os.path.exists(photo_path):
        # Clip circulaire vectoriel absolu pour garantir zéro coin ni cadre
        c.saveState()
        clip_p = c.beginPath()
        clip_p.circle(photo_cx, photo_cy, photo_size / 2.0)
        c.clipPath(clip_p, stroke=0, fill=0)
        c.drawImage(photo_path, photo_x, photo_y, width=photo_size, height=photo_size, mask='auto')
        c.restoreState()

        # Fin contour blanc net (1.2 pt) pour délimiter le portrait du fond bleu
        c.setStrokeColor(colors.HexColor('#ffffff'))
        c.setLineWidth(1.2)
        c.circle(photo_cx, photo_cy, photo_size / 2.0, fill=0, stroke=1)
    else:
        c.setFillColor(colors.HexColor('#1e40af'))
        c.circle(photo_cx, photo_cy, photo_size / 2.0, fill=1, stroke=0)
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(photo_cx, photo_cy - 11, "PH")

    # 3. EN-TÊTE DROITE : NOM ENTIER SUR UNE SEULE LIGNE
    text_x = 138
    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(text_x, PAGE_H - 45, "PHILIPPE HOUNTONDJI")

    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(colors.HexColor('#e0e7ff'))
    c.drawString(text_x, PAGE_H - 66, "DÉVELOPPEUR FULL-STACK & ADMINISTRATEUR RÉSEAU")

    c.setFont("Helvetica", 8.4)
    c.setFillColor(colors.HexColor('#cbd5e1'))
    c.drawString(text_x, PAGE_H - 84, "Porto-Novo & Cotonou, Bénin • Étudiant L3 ENEAM • +229 01 58 15 69 30 • hountondjiphilippe58@gmail.com")

    # ──────────────────────────────────────────────
    # COLONNE GAUCHE (Cadre neutre élégant)
    # ──────────────────────────────────────────────
    col_gauche_x = 32
    col_gauche_w = 162
    col_gauche_bot = 40
    col_gauche_top = PAGE_H - header_h - 14
    col_gauche_h = col_gauche_top - col_gauche_bot

    # Cadre élégant de la colonne gauche
    c.setFillColor(C_WHITE)
    c.roundRect(col_gauche_x, col_gauche_bot, col_gauche_w, col_gauche_h, 8, fill=1, stroke=0)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(col_gauche_x, col_gauche_bot, col_gauche_w, col_gauche_h, 8, fill=0, stroke=1)

    left_pad_x = col_gauche_x + 12
    left_inner_w = col_gauche_w - 24
    y_left = col_gauche_top - 18

    # 1. COORDONNÉES
    draw_section_title(c, left_pad_x, y_left, "COORDONNÉES")
    y_left -= 15
    contacts = [
        ("Localisation", "Porto-Novo & Cotonou, Bénin"),
        ("Email", "hountondjiphilippe58@gmail.com"),
        ("Téléphone", "+229 01 58 15 69 30"),
        ("WhatsApp", "+229 58 15 69 30"),
        ("GitHub", "github.com/hountondji-philippe"),
        ("Portfolio", "portfolio-seven-delta..."),
    ]
    for label, val in contacts:
        c.setFont("Helvetica-Bold", 7.4)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(left_pad_x, y_left, label)
        y_left -= 9.0
        c.setFont("Helvetica", 7.4)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_pad_x, y_left, val)
        y_left -= 10.5

    y_left -= 8

    # 2. PROFIL & VISION
    draw_section_title(c, left_pad_x, y_left, "PROFIL & VISION")
    y_left -= 14
    profil_text = (
        "Double profil associant l'ingénierie logicielle full-stack moderne "
        "(Laravel, React, Node.js) et l'administration réseau d'entreprise "
        "(Cisco IOS, OSPF, VLANs). Orienté performance, résilience et sécurité."
    )
    p_prof = Paragraph(profil_text, ParagraphStyle('Prof', fontName='Helvetica', fontSize=7.3, leading=10.2, textColor=C_TEXT_BODY))
    pw, ph = p_prof.wrap(left_inner_w, 140)
    p_prof.drawOn(c, left_pad_x, y_left - ph + 7)
    y_left -= (ph + 18)

    # 3. LANGUES
    draw_section_title(c, left_pad_x, y_left, "LANGUES")
    y_left -= 14
    langues = [
        ("Français", "Courant"),
        ("Anglais", "Débutant"),
        ("Gun", "Courant"),
    ]
    for lang, level in langues:
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(left_pad_x, y_left, lang)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_pad_x + 52, y_left, f"— {level}")
        y_left -= 11

    y_left -= 8

    # 4. COMPÉTENCES CLÉS
    draw_section_title(c, left_pad_x, y_left, "COMPÉTENCES CLÉS")
    y_left -= 14
    skills_groups = [
        ("Web Full-Stack", "Laravel, React, Node.js, PHP, Tailwind"),
        ("Mobile", "Flutter, Dart (Android & iOS)"),
        ("Réseaux & Infra", "Cisco IOS, OSPF, VLANs, NAT, Linux"),
        ("Bases de données", "PostgreSQL, MySQL, Prisma, Redis"),
        ("DevOps & Outils", "Git, Docker, CI/CD, Wireshark, Figma"),
    ]
    for domain, tools in skills_groups:
        c.setFont("Helvetica-Bold", 7.4)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(left_pad_x, y_left, f"• {domain}")
        y_left -= 9.0

        p_tools = Paragraph(tools, ParagraphStyle('Tools', fontName='Helvetica', fontSize=7.1, leading=9.2, textColor=C_TEXT_MUTED))
        pw, ph = p_tools.wrap(left_inner_w - 4, 80)
        p_tools.drawOn(c, left_pad_x + 4, y_left - ph + 7)
        y_left -= (ph + 5)

    y_left -= 8

    # 5. QUALITÉS & ATOUTS
    draw_section_title(c, left_pad_x, y_left, "QUALITÉS & ATOUTS")
    y_left -= 14
    atouts = [
        "Rigueur d'analyse & sens du détail",
        "Autonomie & résolution proactive",
        "Esprit d'équipe & communication",
        "Veille technologique continue",
    ]
    for a in atouts:
        draw_bullet(c, left_pad_x + 2, y_left + 2.5)
        c.setFont("Helvetica", 7.4)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_pad_x + 9, y_left, a)
        y_left -= 11.5

    # ──────────────────────────────────────────────
    # COLONNE DROITE (Fond blanc, typographie noire stricte)
    # ──────────────────────────────────────────────
    right_x = col_gauche_x + col_gauche_w + 22
    right_w = PAGE_W - right_x - 32
    y_right = col_gauche_top - 4

    # 1. EXPÉRIENCES PROFESSIONNELLES
    draw_section_title(c, right_x, y_right, "EXPÉRIENCES PROFESSIONNELLES")
    y_right -= 16

    exps = [
        {
            "poste": "Stage Développeur Web Full-Stack",
            "contexte": "NextMux, Bénin | Juin 2026 — Présent (Temps plein)",
            "puces": [
                "Conception et développement d'applications web full-stack d'entreprise avec Laravel et React.",
                "Création et sécurisation d'APIs REST performantes (authentification Sanctum, validation stricte).",
                "Modélisation et optimisation de bases de données relationnelles MySQL et PostgreSQL.",
            ]
        },
        {
            "poste": "Développeur Full-Stack & Administrateur Réseau Indépendant",
            "contexte": "Porto-Novo & Cotonou, Bénin | 2024 — Présent",
            "puces": [
                "Développement de la plateforme citoyenne sécurisée VBG Bénin avec cartographie dynamique Leaflet.",
                "Création de la solution Stamux (gestion de stagiaires) avec génération de bilans PDF vectoriels.",
                "Mise en œuvre d'infrastructures réseaux : segmentation VLAN, routage OSPF et sécurisation des flux.",
            ]
        },
        {
            "poste": "Technicien Systèmes & Support Réseau (Missions ponctuelles)",
            "contexte": "Bénin | 2023 — 2024",
            "puces": [
                "Installation, configuration et maintenance de serveurs Linux (Debian, Ubuntu) et Windows Server.",
                "Diagnostic de connectivité réseau, câblage RJ45, configuration commutateurs et maintenance.",
            ]
        }
    ]

    for exp in exps:
        c.setFont("Helvetica-Bold", 9.0)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(right_x, y_right, exp["poste"])
        y_right -= 10.5

        c.setFont("Helvetica-Bold", 7.6)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(right_x, y_right, exp["contexte"])
        y_right -= 11

        for p in exp["puces"]:
            draw_bullet(c, right_x + 3, y_right + 2.5)
            p_obj = Paragraph(p, ParagraphStyle('EP', fontName='Helvetica', fontSize=7.5, leading=9.8, textColor=C_TEXT_BODY))
            pw, ph = p_obj.wrap(right_w - 18, 80)
            p_obj.drawOn(c, right_x + 11, y_right - ph + 7)
            y_right -= (ph + 3)

        y_right -= 6

    y_right -= 6

    # 2. FORMATION ACADÉMIQUE
    draw_section_title(c, right_x, y_right, "FORMATION ACADÉMIQUE")
    y_right -= 16

    c.setFont("Helvetica-Bold", 9.0)
    c.setFillColor(C_TEXT_BLACK)
    c.drawString(right_x, y_right, "Licence en Informatique de Gestion — Spécialité Réseaux & Systèmes")
    y_right -= 10.5

    c.setFont("Helvetica-Bold", 7.6)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(right_x, y_right, "ENEAM, Université d'Abomey-Calavi (UAC), Cotonou | 2024 — Présent (L3 en cours, L1 & L2 validées)")
    y_right -= 10.5

    desc_form = (
        "Cursus universitaire d'excellence alliant génie logiciel et infrastructures : administration réseau Cisco (CCNA), "
        "routage dynamique OSPF, segmentation VLAN, virtualisation, systèmes d'exploitation Linux avancé, modélisation "
        "de bases de données relationnelles (SQL, PostgreSQL) et conception d'applications d'entreprise."
    )
    p_form = Paragraph(desc_form, ParagraphStyle('Form', fontName='Helvetica', fontSize=7.4, leading=10.0, textColor=C_TEXT_BODY))
    pw, ph = p_form.wrap(right_w - 6, 90)
    p_form.drawOn(c, right_x + 2, y_right - ph + 7)
    y_right -= (ph + 18)

    # 3. MAÎTRISE DES INFRASTRUCTURES RÉSEAU CISCO (Calibrée sans débordement : >30 pt de marge à droite)
    draw_section_title(c, right_x, y_right, "MAÎTRISE DES INFRASTRUCTURES RÉSEAU CISCO")
    y_right -= 15

    cisco_h = 76
    c.setFillColor(C_BOX_BG)
    c.roundRect(right_x, y_right - cisco_h, right_w, cisco_h, 4, fill=1, stroke=0)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(right_x, y_right - cisco_h, right_w, cisco_h, 4, fill=0, stroke=1)

    c.setFont("Helvetica-Bold", 7.6)
    c.setFillColor(C_TEXT_BLACK)
    c.drawString(right_x + 10, y_right - 16, "• Routage & Commutation :")
    c.drawString(right_x + 10, y_right - 40, "• Services Réseau :")
    c.drawString(right_x + 10, y_right - 60, "• Systèmes d'exploitation :")

    c.setFont("Helvetica", 7.4)
    c.setFillColor(C_TEXT_BODY)
    c.drawString(right_x + 120, y_right - 16, "OSPFv2/v3, Routage Statique, Inter-VLAN, VLANs,")
    c.drawString(right_x + 120, y_right - 27, "STP / RSTP, EtherChannel, Trunking 802.1Q")
    c.drawString(right_x + 120, y_right - 40, "DHCP, DNS, NAT/PAT, SSHv2, NTP, SNMP, Wireshark")
    c.drawString(right_x + 120, y_right - 60, "Linux Debian, Ubuntu Server, Windows Server 2022")

    y_right -= (cisco_h + 18)

    # 4. MÉTHODOLOGIE LOGICIELLE & STANDARDS INDUSTRIELS (Calibrée sans débordement : >30 pt de marge à droite)
    draw_section_title(c, right_x, y_right, "MÉTHODOLOGIE LOGICIELLE & STANDARDS INDUSTRIELS")
    y_right -= 15

    method_h = 68
    c.setFillColor(C_BOX_BG)
    c.roundRect(right_x, y_right - method_h, right_w, method_h, 4, fill=1, stroke=0)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(right_x, y_right - method_h, right_w, method_h, 4, fill=0, stroke=1)

    methodes = [
        ("• Gestion de versions & CI :", "Git Flow rigoureux, commits conventionnels, GitHub Actions."),
        ("• Méthodologie agile :", "Scrum, autonomie proactive, réunions de sync, respect des délais."),
        ("• Qualité & Clean Code :", "Architecture SOLID, modularité, refactorisation et tests."),
        ("• Documentation technique :", "Spécifications claires, schémas d'architecture et déploiement."),
    ]
    my = y_right - 15
    for label, desc in methodes:
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(right_x + 10, my, label)
        c.setFont("Helvetica", 7.4)
        c.setFillColor(C_TEXT_BODY)
        c.drawString(right_x + 124, my, desc)
        my -= 14

    # Pied de page Page 1
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.line(32, 26, PAGE_W - 32, 26)

    c.setFont("Helvetica", 7.2)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(32, 16, "Hountondji Philippe — Curriculum Vitae • Développeur Full-Stack & Administrateur Réseau")
    c.drawRightString(PAGE_W - 32, 16, "Page 1 / 2")


# ══════════════════════════════════════════════════════════════════════
# PAGE 2 — PROJETS PHARES (CARTES COMPACTES SANS AUCUN BLOC EN TROP)
# ══════════════════════════════════════════════════════════════════════
def draw_header_page2(c):
    header_h = 60
    c.setFillColor(C_CANVA_BLUE)
    c.rect(0, PAGE_H - header_h, PAGE_W, header_h, fill=1, stroke=0)

    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(32, PAGE_H - 28, "PHILIPPE HOUNTONDJI")

    c.setFont("Helvetica", 8.8)
    c.setFillColor(colors.HexColor('#e0e7ff'))
    c.drawString(32, PAGE_H - 44, "PROJETS PHARES & RÉALISATIONS TECHNIQUES")

    c.drawRightString(PAGE_W - 32, PAGE_H - 25, "Porto-Novo, Bénin • +229 01 58 15 69 30")
    c.drawRightString(PAGE_W - 32, PAGE_H - 38, "hountondjiphilippe58@gmail.com")
    c.drawRightString(PAGE_W - 32, PAGE_H - 49, "github.com/hountondji-philippe")


def draw_project_card_compact(c, x, y, w, h, titre, badge, techs, desc, real_url):
    """
    Carte projet compacte, équilibrée (hauteur 120 pt) pour un rendu net et non surchargé.
    """
    c.setFillColor(C_CARD_BG)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=0)

    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 6, fill=0, stroke=1)

    inner_x = x + 11
    inner_w = w - 22
    curr_y = y + h - 17

    # Badge type (fond gris neutre, contour fin)
    badge_w = c.stringWidth(badge, "Helvetica-Bold", 6.2) + 8
    badge_x = x + w - badge_w - 9
    c.setFillColor(colors.HexColor('#f1f5f9'))
    c.roundRect(badge_x, curr_y - 2, badge_w, 11, 3.5, fill=1, stroke=0)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.6)
    c.roundRect(badge_x, curr_y - 2, badge_w, 11, 3.5, fill=0, stroke=1)
    c.setFillColor(C_TEXT_BLACK)
    c.setFont("Helvetica-Bold", 6.2)
    c.drawString(badge_x + 4, curr_y + 1, badge)

    # Titre du projet en noir franc
    titre_max_w = badge_x - inner_x - 6
    p_titre = Paragraph(titre, ParagraphStyle('PT', fontName='Helvetica-Bold', fontSize=9.2, leading=11, textColor=C_TEXT_BLACK))
    tw, th = p_titre.wrap(titre_max_w, 30)
    p_titre.drawOn(c, inner_x, curr_y - th + 9)

    curr_y -= max(15, th + 4)

    # Technologies
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(inner_x, curr_y, techs)

    curr_y -= 12

    # Description complète
    p_desc = Paragraph(desc, ParagraphStyle('PD2', fontName='Helvetica', fontSize=7.3, leading=10.2, textColor=C_TEXT_BODY))
    pw, ph = p_desc.wrap(inner_w, 65)
    p_desc.drawOn(c, inner_x, curr_y - ph + 8)

    # Vrai lien direct et actif du site web
    if real_url:
        clean_display_url = real_url.replace("https://", "").replace("http://", "").rstrip("/")
        link_y = y + 9
        c.setFont("Helvetica-Bold", 7.3)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(inner_x, link_y, f"Lien direct : {clean_display_url} ↗")


def get_projets_data():
    """
    Récupère dynamiquement les projets depuis l'API locale ou fallback officiel.
    """
    url_api = "http://127.0.0.1:3000/api/projects"
    try:
        req = urllib.request.Request(url_api, headers={'User-Agent': 'Python-CV-Generator'})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('success') and data.get('projects'):
                projs = []
                for p in data['projects'][:6]:
                    url = p.get('lienSite') or p.get('lienGithub') or ''
                    projs.append({
                        "titre": p.get('titre', 'Projet'),
                        "badge": "PROFESSIONNEL" if p.get('type') == 'PROFESSIONNEL' else "ACADÉMIQUE",
                        "techs": p.get('technologies', 'Full-Stack'),
                        "desc": p.get('description', ''),
                        "url": url
                    })
                if len(projs) >= 4:
                    return projs
    except Exception:
        pass

    # Données officielles calibrées avec leurs vrais liens de production
    return [
        {
            "titre": "Stamux — Internship OS",
            "badge": "PROFESSIONNEL",
            "techs": "Laravel 12 · Sanctum · DomPDF · React · MySQL",
            "desc": "Plateforme complète de gestion de stagiaires avec architecture multicouche respectant les principes SOLID. 68 routes API REST sécurisées, génération automatisée de bilans et conventions de stage en PDF vectoriel.",
            "url": "https://stamux.vercel.app"
        },
        {
            "titre": "Simulation Réseau Campus Multi-Sites",
            "badge": "ACADÉMIQUE / RÉSEAU",
            "techs": "Cisco IOS · OSPF Multi-Area · VLANs 802.1Q · HSRP",
            "desc": "Architecture réseau campus simulant 3 bâtiments interconnectés avec tolérance aux pannes. Routage dynamique OSPF, redondance de passerelle par défaut HSRP, segmentation 4 VLANs et sécurité des ports.",
            "url": "https://github.com/hountondji-philippe"
        },
        {
            "titre": "RestoDirect — Commande & Livraison",
            "badge": "PROFESSIONNEL",
            "techs": "Next.js · Prisma · PostgreSQL · WebSockets · Tailwind",
            "desc": "Application web temps réel de commande pour restaurants. Mises à jour instantanées cuisine-livreur par WebSockets, géolocalisation dynamique Leaflet, gestion de commandes et tableaux de bord de suivi.",
            "url": "https://restodirect-web.vercel.app"
        },
        {
            "titre": "Plateforme Citoyenne VBG Bénin",
            "badge": "IMPACT SOCIAL",
            "techs": "Node.js · Express · Chiffrement AES-256 · Leaflet",
            "desc": "Solution de signalement civique 100% anonyme contre les violences basées sur le genre. Chiffrement de bout en bout des dépositions (AES-256), cartographie d'alertes et interface légère optimisée mobile.",
            "url": "https://vbg-benin.netlify.app"
        },
        {
            "titre": "Mémoire+ — Gestion Académique ENEAM",
            "badge": "ACADÉMIQUE",
            "techs": "Laravel · React · MySQL · Workflow de Validation",
            "desc": "Système de dépôt, contrôle de conformité et archivage des mémoires universitaires de l'ENEAM. Workflow collaboratif à double validation tuteur/jury et moteur de recherche multicritère par filière.",
            "url": "https://stage-taupe-nine.vercel.app"
        },
        {
            "titre": "Portfolio Cyberpunk & Lab Technique",
            "badge": "PERSONNEL",
            "techs": "JavaScript ES6+ · Vercel Functions · JWT · CSRF HMAC",
            "desc": "Vitrine d'ingénierie moderne sans framework lourd : terminal interactif Cisco intégré, PWA hors-ligne, audit de sécurité OWASP (en-têtes stricts, CSP, validation cryptographique de jetons d'accès).",
            "url": "https://portfolio-seven-delta-21jq5u35et.vercel.app"
        }
    ]


def draw_page2(c):
    draw_header_page2(c)

    start_y = PAGE_H - 85
    card_w = 258
    card_h = 120  # Hauteur compacte et élégante
    col1_x = 32
    col2_x = 305

    draw_section_title(c, 32, start_y, "PROJETS PHARES & RÉALISATIONS D'INGÉNIERIE")
    start_y -= 22

    projets = get_projets_data()

    row_y = start_y
    for i in range(0, min(6, len(projets)), 2):
        p1 = projets[i]
        draw_project_card_compact(c, col1_x, row_y - card_h, card_w, card_h, 
                                  p1["titre"], p1["badge"], p1["techs"], p1["desc"], p1["url"])
        
        if i + 1 < len(projets):
            p2 = projets[i + 1]
            draw_project_card_compact(c, col2_x, row_y - card_h, card_w, card_h, 
                                      p2["titre"], p2["badge"], p2["techs"], p2["desc"], p2["url"])

        row_y -= (card_h + 18)

    # Pied de page Page 2 (aucun encadré supplémentaire en dessous)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.line(32, 26, PAGE_W - 32, 26)

    c.setFont("Helvetica", 7.2)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(32, 16, "Hountondji Philippe — Curriculum Vitae • Développeur Full-Stack & Administrateur Réseau")
    c.drawRightString(PAGE_W - 32, 16, "Page 2 / 2")


def generate_cv_pdf(output_path, photo_src):
    temp_photo = "temp_philippe_circ.png"
    has_photo = prepare_circular_photo(photo_src, temp_photo, size_px=500)
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
    photo_file = os.path.join(base_dir, "public", "images", "philippe-cv.png")
    if not os.path.exists(photo_file):
        photo_file = os.path.join(base_dir, "public", "images", "philippe.jpeg")
    
    out1 = os.path.join(base_dir, "public", "assets", "CV_Philippe_Hountondji.pdf")
    out2 = os.path.join(base_dir, "public", "CV_Philippe_Hountondji.pdf")

    os.makedirs(os.path.dirname(out1), exist_ok=True)

    generate_cv_pdf(out1, photo_file)
    generate_cv_pdf(out2, photo_file)
