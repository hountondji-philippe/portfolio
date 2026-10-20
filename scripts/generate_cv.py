#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Générateur de CV Haute Fidélité — Philippe Hountondji
Aligné strictement sur le modèle Canva (Design Arch & Corporate Blue) :
- Bannière supérieure bleu profond (#003478) avec typographie blanche percutante
- Colonne gauche sous forme d'arche capsule avec contour #003478 et fond blanc
- Photo d'identité circulaire parfaitement intégrée au sommet de l'arche
- Typographie suisse moderne : AUCUN texte coloré dans le corps (tout en noir/anthracite élégant #0f172a / #1e293b)
- Page 1 & Page 2 parfaitement équilibrées verticalement, sans aucun espace vide anormal
- Vrais liens directs de production vérifiés pour les 6 projets phares sur la Page 2
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
# PALETTE DE COULEURS CANVA CORPORATE
# ══════════════════════════════════════════════════════════════════════
C_CANVA_BLUE = colors.HexColor('#003478')   # Bleu royal profond du modèle Canva
C_WHITE      = colors.white

# Corps du document : TEXTES NON COLORÉS (noir & gris neutres stricts)
C_TEXT_BLACK = colors.HexColor('#0f172a')   # Noir profond / Anthracite (titres & labels)
C_TEXT_BODY  = colors.HexColor('#1e293b')   # Gris foncé (descriptions & puces)
C_TEXT_MUTED = colors.HexColor('#475569')   # Gris ardoise (sous-titres, dates & métadonnées)
C_BORDER     = colors.HexColor('#cbd5e1')   # Bordure neutre discrète
C_CARD_BG    = colors.HexColor('#ffffff')   # Fond blanc pur pour les cartes
C_BOX_BG     = colors.HexColor('#f8fafc')   # Fond gris très clair pour les blocs techniques


def prepare_circular_photo(source_path, dest_path, size_px=400):
    """
    Découpe et prépare un portrait circulaire net centré sur le visage et le buste.
    """
    try:
        if not os.path.exists(source_path):
            return False
        img = Image.open(source_path).convert("RGBA")
        w, h = img.size

        # Image paysage 494x282 : recadrage 250x250 centré horizontalement, top=5
        if w > h:
            crop_size = min(250, h - 5)
            left = (w - crop_size) // 2
            top = 5
            left = max(0, min(left, w - crop_size))
            top_crop = max(0, min(top, h - crop_size))
            cropped = img.crop((left, top_crop, left + crop_size, top_crop + crop_size))
        else:
            side = min(w, h)
            left = (w - side) // 2
            cropped = img.crop((left, 0, left + side, side))

        cropped = cropped.resize((size_px, size_px), Image.Resampling.LANCZOS)

        mask = Image.new("L", (size_px, size_px), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size_px, size_px), fill=255)

        output = Image.new("RGBA", (size_px, size_px), (255, 255, 255, 255))
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
# PAGE 1 — MODÈLE CANVA (ARCHE & BANNIÈRE SUPÉRIEURE)
# ══════════════════════════════════════════════════════════════════════
def draw_page1(c, photo_path):
    header_h = 168  # Hauteur de la bannière bleue

    # 1. Bannière supérieure bleu profond Canva
    c.setFillColor(C_CANVA_BLUE)
    c.rect(0, PAGE_H - header_h, PAGE_W, header_h, fill=1, stroke=0)

    # 2. Arche de la colonne gauche (forme capsule avec sommet semi-circulaire)
    arch_x = 32
    arch_w = 164
    arch_rx = arch_x + arch_w
    arch_top = PAGE_H - 22
    arch_r = arch_w / 2.0  # 82 pt
    arch_cy = arch_top - arch_r  # 737.89
    arch_bot = 42  # Calibré pour entourer élégamment tout le contenu gauche

    p = c.beginPath()
    p.moveTo(arch_x, arch_bot)
    p.lineTo(arch_x, arch_cy)
    p.arc(arch_x, arch_cy - arch_r, arch_rx, arch_cy + arch_r, 180, -180)
    p.lineTo(arch_rx, arch_bot)
    p.lineTo(arch_x, arch_bot)
    p.close()

    # Fond blanc pur + contour bleu Canva 1.8 pt
    c.setFillColor(C_WHITE)
    c.setStrokeColor(C_CANVA_BLUE)
    c.setLineWidth(1.8)
    c.drawPath(p, fill=1, stroke=1)

    # 3. Photo circulaire au sommet de l'arche
    photo_size = 98
    photo_x = arch_x + (arch_w - photo_size) / 2.0
    photo_y = arch_cy - (photo_size / 2.0) + 6

    if os.path.exists(photo_path):
        c.setFillColor(C_WHITE)
        c.circle(photo_x + photo_size/2, photo_y + photo_size/2, (photo_size/2) + 2, fill=1, stroke=0)
        c.drawImage(photo_path, photo_x, photo_y, width=photo_size, height=photo_size, mask='auto')
        c.setStrokeColor(C_BORDER)
        c.setLineWidth(0.8)
        c.circle(photo_x + photo_size/2, photo_y + photo_size/2, (photo_size/2) + 0.5, fill=0, stroke=1)
    else:
        c.setFillColor(colors.HexColor('#e2e8f0'))
        c.circle(photo_x + photo_size/2, photo_y + photo_size/2, photo_size/2, fill=1, stroke=0)
        c.setFillColor(C_CANVA_BLUE)
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(photo_x + photo_size/2, photo_y + photo_size/2 - 12, "PH")

    # 4. En-tête candidat dans la bannière supérieure (droite)
    text_x = arch_rx + 24
    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 27)
    c.drawString(text_x, PAGE_H - 64, "PHILIPPE")
    c.drawString(text_x, PAGE_H - 94, "HOUNTONDJI")

    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(colors.HexColor('#e0e7ff'))
    c.drawString(text_x, PAGE_H - 120, "DÉVELOPPEUR FULL-STACK & ADMINISTRATEUR RÉSEAU")

    c.setFont("Helvetica", 8.2)
    c.setFillColor(colors.HexColor('#cbd5e1'))
    c.drawString(text_x, PAGE_H - 138, "Porto-Novo & Cotonou, Bénin • Étudiant L3 ENEAM • +229 01 58 15 69 30")

    # ──────────────────────────────────────────────
    # COLONNE GAUCHE (Intérieur de l'arche blanche)
    # ──────────────────────────────────────────────
    left_pad_x = arch_x + 12
    left_inner_w = arch_w - 24
    y_left = photo_y - 20

    # 1. COORDONNÉES
    draw_section_title(c, left_pad_x, y_left, "COORDONNÉES")
    y_left -= 16
    contacts = [
        ("Localisation", "Porto-Novo & Cotonou, Bénin"),
        ("Email", "hountondjiphilippe58@gmail.com"),
        ("Téléphone", "+229 01 58 15 69 30"),
        ("WhatsApp", "+229 58 15 69 30"),
        ("GitHub", "github.com/hountondji-philippe"),
        ("Portfolio", "portfolio-seven-delta..."),
    ]
    for label, val in contacts:
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(left_pad_x, y_left, label)
        y_left -= 9.5
        c.setFont("Helvetica", 7.4)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_pad_x, y_left, val)
        y_left -= 11

    y_left -= 6

    # 2. PROFIL & VISION
    draw_section_title(c, left_pad_x, y_left, "PROFIL & VISION")
    y_left -= 15
    profil_text = (
        "Double profil alliant l'ingénierie logicielle full-stack moderne "
        "(Laravel, React, Node.js) et l'administration réseau avancée "
        "(Cisco IOS, OSPF, VLANs). Orienté robustesse, sécurité et haute disponibilité "
        "des infrastructures d'entreprise."
    )
    p_prof = Paragraph(profil_text, ParagraphStyle('Prof', fontName='Helvetica', fontSize=7.4, leading=10.6, textColor=C_TEXT_BODY))
    pw, ph = p_prof.wrap(left_inner_w, 140)
    p_prof.drawOn(c, left_pad_x, y_left - ph + 7)
    y_left -= (ph + 16)

    # 3. LANGUES
    draw_section_title(c, left_pad_x, y_left, "LANGUES")
    y_left -= 15
    langues = [
        ("Français", "Courant"),
        ("Anglais", "Débutant"),
        ("Gun", "Courant"),
    ]
    for lang, level in langues:
        c.setFont("Helvetica-Bold", 7.6)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(left_pad_x, y_left, lang)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_pad_x + 52, y_left, f"— {level}")
        y_left -= 11.5

    y_left -= 7

    # 4. COMPÉTENCES CLÉS
    draw_section_title(c, left_pad_x, y_left, "COMPÉTENCES CLÉS")
    y_left -= 15
    skills_groups = [
        ("Web Full-Stack", "Laravel, React, Node.js, PHP, Tailwind CSS, TypeScript"),
        ("Mobile", "Flutter, Dart (Android & iOS)"),
        ("Réseaux & Infra", "Cisco IOS, OSPF, VLANs, NAT, STP, Linux Debian"),
        ("Bases de données", "PostgreSQL, MySQL, Prisma ORM, Redis"),
        ("DevOps & Outils", "Git, Docker, CI/CD, Wireshark, Figma"),
    ]
    for domain, tools in skills_groups:
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(left_pad_x, y_left, f"• {domain}")
        y_left -= 9.5

        p_tools = Paragraph(tools, ParagraphStyle('Tools', fontName='Helvetica', fontSize=7.2, leading=9.6, textColor=C_TEXT_MUTED))
        pw, ph = p_tools.wrap(left_inner_w - 4, 80)
        p_tools.drawOn(c, left_pad_x + 4, y_left - ph + 7)
        y_left -= (ph + 5.5)

    y_left -= 6

    # 5. QUALITÉS & ATOUTS
    draw_section_title(c, left_pad_x, y_left, "QUALITÉS & ATOUTS")
    y_left -= 15
    atouts = [
        "Rigueur d'analyse & sens du détail",
        "Autonomie & résolution proactive",
        "Esprit d'équipe & communication claire",
        "Veille technologique active continue",
    ]
    for a in atouts:
        draw_bullet(c, left_pad_x + 2, y_left + 2.5)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(left_pad_x + 9, y_left, a)
        y_left -= 12

    # ──────────────────────────────────────────────
    # COLONNE DROITE (Fond blanc, typographie noire)
    # ──────────────────────────────────────────────
    right_x = text_x
    right_w = PAGE_W - right_x - 32
    y_right = PAGE_H - header_h - 18

    # 1. EXPÉRIENCES PROFESSIONNELLES
    draw_section_title(c, right_x, y_right, "EXPÉRIENCES PROFESSIONNELLES")
    y_right -= 16

    exps = [
        {
            "poste": "Stage Développeur Web Full-Stack",
            "contexte": "NextMux, Bénin | Juin 2026 — Présent (Temps plein)",
            "puces": [
                "Conception et développement d'applications web full-stack d'entreprise robustes avec Laravel et React.",
                "Création et sécurisation d'APIs REST performantes (authentification Sanctum, validation stricte).",
                "Modélisation et optimisation de bases de données relationnelles MySQL et PostgreSQL.",
            ]
        },
        {
            "poste": "Développeur Full-Stack & Administrateur Réseau Indépendant",
            "contexte": "Porto-Novo & Cotonou, Bénin | 2024 — Présent",
            "puces": [
                "Développement de la plateforme citoyenne sécurisée VBG Bénin avec cartographie dynamique Leaflet.",
                "Création de la plateforme de gestion de stagiaires Stamux (Internship OS) avec génération PDF.",
                "Mise en œuvre d'infrastructures réseaux : segmentation VLAN, routage OSPF et interconnexions.",
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
        c.setFont("Helvetica-Bold", 9.2)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(right_x, y_right, exp["poste"])
        y_right -= 11

        c.setFont("Helvetica-Bold", 7.7)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(right_x, y_right, exp["contexte"])
        y_right -= 11.5

        for p in exp["puces"]:
            draw_bullet(c, right_x + 3, y_right + 2.5)
            p_obj = Paragraph(p, ParagraphStyle('EP', fontName='Helvetica', fontSize=7.6, leading=10.2, textColor=C_TEXT_BODY))
            pw, ph = p_obj.wrap(right_w - 14, 80)
            p_obj.drawOn(c, right_x + 11, y_right - ph + 7)
            y_right -= (ph + 3.5)

        y_right -= 7

    y_right -= 6

    # 2. FORMATION ACADÉMIQUE
    draw_section_title(c, right_x, y_right, "FORMATION ACADÉMIQUE")
    y_right -= 16

    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(C_TEXT_BLACK)
    c.drawString(right_x, y_right, "Licence en Informatique de Gestion — Spécialité Réseaux & Systèmes")
    y_right -= 11

    c.setFont("Helvetica-Bold", 7.7)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(right_x, y_right, "ENEAM, Université d'Abomey-Calavi (UAC), Cotonou | 2024 — Présent (L3 en cours, L1 & L2 validées)")
    y_right -= 11

    desc_form = (
        "Cursus universitaire d'excellence alliant génie logiciel et infrastructures : administration réseau Cisco (CCNA), "
        "routage dynamique OSPF, segmentation VLAN, virtualisation, systèmes d'exploitation Linux avancé, modélisation "
        "de bases de données relationnelles (SQL, PostgreSQL) et conception d'applications d'entreprise."
    )
    p_form = Paragraph(desc_form, ParagraphStyle('Form', fontName='Helvetica', fontSize=7.6, leading=10.4, textColor=C_TEXT_BODY))
    pw, ph = p_form.wrap(right_w - 4, 100)
    p_form.drawOn(c, right_x + 2, y_right - ph + 7)
    y_right -= (ph + 18)

    # 3. MAÎTRISE DES INFRASTRUCTURES RÉSEAU CISCO
    draw_section_title(c, right_x, y_right, "MAÎTRISE DES INFRASTRUCTURES RÉSEAU CISCO")
    y_right -= 16

    cisco_h = 78
    c.setFillColor(C_BOX_BG)
    c.roundRect(right_x, y_right - cisco_h, right_w, cisco_h, 4, fill=1, stroke=0)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(right_x, y_right - cisco_h, right_w, cisco_h, 4, fill=0, stroke=1)

    c.setFont("Helvetica-Bold", 7.7)
    c.setFillColor(C_TEXT_BLACK)
    c.drawString(right_x + 10, y_right - 16, "• Routage & Commutation :")
    c.drawString(right_x + 10, y_right - 42, "• Services & Supervision :")
    c.drawString(right_x + 10, y_right - 62, "• Systèmes d'exploitation :")

    c.setFont("Helvetica", 7.6)
    c.setFillColor(C_TEXT_BODY)
    c.drawString(right_x + 128, y_right - 16, "OSPFv2/v3, Routage Statique, Inter-VLAN, VLANs (802.1Q),")
    c.drawString(right_x + 128, y_right - 28, "STP / RSTP, EtherChannel, Trunking 802.1Q")
    c.drawString(right_x + 128, y_right - 42, "DHCP, DNS, NAT/PAT, SSHv2, NTP, SNMP, Wireshark")
    c.drawString(right_x + 128, y_right - 62, "Linux Debian, Ubuntu Server (systemd, Nginx), Windows Server 2022")

    y_right -= (cisco_h + 16)

    # 4. MÉTHODOLOGIE LOGICIELLE & STANDARDS INDUSTRIELS
    draw_section_title(c, right_x, y_right, "MÉTHODOLOGIE LOGICIELLE & STANDARDS INDUSTRIELS")
    y_right -= 16

    method_h = 70
    c.setFillColor(C_BOX_BG)
    c.roundRect(right_x, y_right - method_h, right_w, method_h, 4, fill=1, stroke=0)
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(right_x, y_right - method_h, right_w, method_h, 4, fill=0, stroke=1)

    methodes = [
        ("• Gestion de versions & CI :", "Git Flow rigoureux, commits conventionnels, GitHub Actions."),
        ("• Méthodologie de travail :", "Agile / Scrum, autonomie, réunions de sync, respect des délais."),
        ("• Qualité & Clean Code :", "Lisibilité, modularité, refactorisation et tests fonctionnels."),
        ("• Documentation technique :", "Spécifications claires, schémas d'architecture et déploiement."),
    ]
    my = y_right - 15
    for label, desc in methodes:
        c.setFont("Helvetica-Bold", 7.6)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(right_x + 10, my, label)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_TEXT_BODY)
        c.drawString(right_x + 130, my, desc)
        my -= 14.5

    # Pied de page Page 1
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.line(32, 26, PAGE_W - 32, 26)

    c.setFont("Helvetica", 7.2)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(32, 16, "Hountondji Philippe — Curriculum Vitae • Développeur Full-Stack & Administrateur Réseau")
    c.drawRightString(PAGE_W - 32, 16, "Page 1 / 2")


# ══════════════════════════════════════════════════════════════════════
# PAGE 2 — PROJETS PHARES & RÉALISATIONS D'INGÉNIERIE
# ══════════════════════════════════════════════════════════════════════
def draw_header_page2(c):
    header_h = 64
    c.setFillColor(C_CANVA_BLUE)
    c.rect(0, PAGE_H - header_h, PAGE_W, header_h, fill=1, stroke=0)

    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(32, PAGE_H - 30, "PHILIPPE HOUNTONDJI")

    c.setFont("Helvetica", 9.0)
    c.setFillColor(colors.HexColor('#e0e7ff'))
    c.drawString(32, PAGE_H - 46, "PROJETS PHARES & RÉALISATIONS TECHNIQUES")

    c.drawRightString(PAGE_W - 32, PAGE_H - 26, "Porto-Novo, Bénin • +229 01 58 15 69 30")
    c.drawRightString(PAGE_W - 32, PAGE_H - 39, "hountondjiphilippe58@gmail.com")
    c.drawRightString(PAGE_W - 32, PAGE_H - 51, "github.com/hountondji-philippe")


def draw_project_card_page2(c, x, y, w, h, titre, badge, techs, desc, real_url, points):
    """
    Carte projet élégante et généreuse (hauteur 212 pt) qui occupe harmonieusement Page 2.
    """
    c.setFillColor(C_CARD_BG)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=0)

    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 6, fill=0, stroke=1)

    inner_x = x + 12
    inner_w = w - 24
    curr_y = y + h - 18

    # Badge type (fond gris neutre, contour fin)
    badge_w = c.stringWidth(badge, "Helvetica-Bold", 6.2) + 8
    badge_x = x + w - badge_w - 10
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
    p_titre = Paragraph(titre, ParagraphStyle('PT', fontName='Helvetica-Bold', fontSize=9.4, leading=11.5, textColor=C_TEXT_BLACK))
    tw, th = p_titre.wrap(titre_max_w, 35)
    p_titre.drawOn(c, inner_x, curr_y - th + 9)

    curr_y -= max(16, th + 4)

    # Technologies
    c.setFont("Helvetica-Bold", 7.6)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(inner_x, curr_y, techs)

    curr_y -= 10

    # Ligne fine de séparation intérieure
    c.setStrokeColor(colors.HexColor('#f1f5f9'))
    c.setLineWidth(0.6)
    c.line(inner_x, curr_y, inner_x + inner_w, curr_y)

    curr_y -= 10

    # Description complète
    p_desc = Paragraph(desc, ParagraphStyle('PD2', fontName='Helvetica', fontSize=7.4, leading=10.6, textColor=C_TEXT_BODY))
    pw, ph = p_desc.wrap(inner_w, 120)
    p_desc.drawOn(c, inner_x, curr_y - ph + 8)

    curr_y -= (ph + 8)

    # Points clés d'ingénierie
    if points:
        for pt in points:
            draw_bullet(c, inner_x + 2, curr_y + 2.5)
            p_pt = Paragraph(pt, ParagraphStyle('PPT', fontName='Helvetica', fontSize=7.2, leading=9.5, textColor=C_TEXT_MUTED))
            pw, ph = p_pt.wrap(inner_w - 12, 50)
            p_pt.drawOn(c, inner_x + 8, curr_y - ph + 7)
            curr_y -= (ph + 3.5)

    # Vrai lien direct et actif du site web
    if real_url:
        clean_display_url = real_url.replace("https://", "").replace("http://", "").rstrip("/")
        c.setFont("Helvetica-Bold", 7.4)
        c.setFillColor(C_TEXT_BLACK)
        c.drawString(inner_x, y + 10, f"Lien direct : {clean_display_url} ↗")


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
                        "url": url,
                        "points": []
                    })
                if len(projs) >= 4:
                    return projs
    except Exception:
        pass

    # Données officielles enrichies avec leurs vrais liens et détails d'ingénierie
    return [
        {
            "titre": "Stamux — Internship OS",
            "badge": "PROFESSIONNEL",
            "techs": "Laravel 12 · Sanctum · DomPDF · React · MySQL",
            "desc": "Plateforme complète de gestion de stagiaires avec architecture multicouche respectant les principes SOLID. Conçue pour automatiser le cycle de vie complet des stages académiques et professionnels.",
            "points": [
                "68 routes API REST sécurisées avec gestion fine des rôles (Admin, Tuteur, Stagiaire).",
                "Génération automatisée de bilans d'évaluation, attestations et conventions de stage en PDF vectoriel.",
                "Tableaux de bord analytiques temps réel avec suivi de présence et jalons hebdomadaires."
            ],
            "url": "https://stamux.vercel.app"
        },
        {
            "titre": "Simulation Réseau Campus Multi-Sites",
            "badge": "ACADÉMIQUE / RÉSEAU",
            "techs": "Cisco IOS · OSPF Multi-Area · VLANs 802.1Q · HSRP",
            "desc": "Conception d'une infrastructure réseau complète simulant 3 bâtiments interconnectés pour un campus universitaire, garantissant tolérance aux pannes et haute disponibilité.",
            "points": [
                "Routage dynamique OSPF multi-aires avec agrégation de routes et plan d'adressage VLSM.",
                "Redondance de passerelle par défaut HSRP et segmentation logique en 4 VLANs distincts.",
                "Contrôle d'accès rigoureux via ACLs standard et étendues, sécurisation des ports (Port-Security)."
            ],
            "url": "https://github.com/hountondji-philippe"
        },
        {
            "titre": "RestoDirect — Commande & Livraison",
            "badge": "PROFESSIONNEL",
            "techs": "Next.js · Prisma · PostgreSQL · WebSockets · Tailwind",
            "desc": "Application web temps réel de commande en ligne et gestion logistique pour restaurants. Permet une synchronisation instantanée entre la cuisine, les clients et les coursiers.",
            "points": [
                "Flux de commandes bidirectionnel instantané via WebSockets et notifications push.",
                "Suivi géolocalisé en temps réel sur carte dynamique Leaflet et routage intelligent.",
                "Interface responsive optimisée mobile avec panier persistant et historique des commandes."
            ],
            "url": "https://restodirect-web.vercel.app"
        },
        {
            "titre": "Plateforme Citoyenne VBG Bénin",
            "badge": "IMPACT SOCIAL",
            "techs": "Node.js · Express · Chiffrement AES-256 · Leaflet",
            "desc": "Solution civique et sécurisée de signalement 100% anonyme dédiée à la lutte contre les violences basées sur le genre au Bénin, garantissant la stricte protection des victimes.",
            "points": [
                "Chiffrement de bout en bout des données sensibles et dépositions citoyennes (AES-256).",
                "Cartographie anonymisée des alertes permettant d'identifier les zones à fort besoin d'assistance.",
                "Conception PWA ultra-légère accessible sur réseaux mobiles à bande passante limitée."
            ],
            "url": "https://vbg-benin.netlify.app"
        },
        {
            "titre": "Mémoire+ — Gestion Académique ENEAM",
            "badge": "ACADÉMIQUE",
            "techs": "Laravel · React · MySQL · Workflow de Validation",
            "desc": "Système universitaire de dépôt, contrôle de conformité et archivage numérique des mémoires de fin de cycle de l'ENEAM (Université d'Abomey-Calavi).",
            "points": [
                "Workflow collaboratif à double validation tuteur/jury avec historique d'annotations.",
                "Moteur de recherche multicritère par filière, promotion et mots-clés thématiques.",
                "Stockage cloud sécurisé avec vérification d'intégrité SHA-256 et métadonnées d'archivage."
            ],
            "url": "https://stage-taupe-nine.vercel.app"
        },
        {
            "titre": "Portfolio Cyberpunk & Lab Technique",
            "badge": "PERSONNEL",
            "techs": "JavaScript ES6+ · Vercel Functions · JWT · CSRF HMAC",
            "desc": "Vitrine d'ingénierie web moderne sans framework lourd : terminal interactif Cisco intégré, mode hors-ligne PWA et audit rigoureux de sécurité OWASP.",
            "points": [
                "En-têtes de sécurité stricts (CSP, HSTS, X-Content-Type-Options) et mitigation anti-XSS.",
                "Terminal interactif simulant l'invite de commande Cisco IOS avec auto-complétion.",
                "Score de performance Lighthouse 98+ et adaptation responsive absolue tous écrans."
            ],
            "url": "https://portfolio-seven-delta-21jq5u35et.vercel.app"
        }
    ]


def draw_page2(c):
    draw_header_page2(c)

    start_y = PAGE_H - 85
    card_w = 258
    card_h = 212  # Hauteur calibrée pour occuper harmonieusement la Page 2
    col1_x = 32
    col2_x = 305

    draw_section_title(c, 32, start_y, "PROJETS PHARES & RÉALISATIONS D'INGÉNIERIE")
    start_y -= 18

    projets = get_projets_data()

    row_y = start_y
    for i in range(0, min(6, len(projets)), 2):
        p1 = projets[i]
        draw_project_card_page2(c, col1_x, row_y - card_h, card_w, card_h, 
                                p1["titre"], p1["badge"], p1["techs"], p1["desc"], p1["url"], p1.get("points", []))
        
        if i + 1 < len(projets):
            p2 = projets[i + 1]
            draw_project_card_page2(c, col2_x, row_y - card_h, card_w, card_h, 
                                    p2["titre"], p2["badge"], p2["techs"], p2["desc"], p2["url"], p2.get("points", []))

        row_y -= (card_h + 16)

    # Pied de page Page 2
    c.setStrokeColor(C_BORDER)
    c.setLineWidth(0.8)
    c.line(32, 26, PAGE_W - 32, 26)

    c.setFont("Helvetica", 7.2)
    c.setFillColor(C_TEXT_MUTED)
    c.drawString(32, 16, "Hountondji Philippe — Curriculum Vitae • Développeur Full-Stack & Administrateur Réseau")
    c.drawRightString(PAGE_W - 32, 16, "Page 2 / 2")


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
    photo_file = os.path.join(base_dir, "public", "images", "philippe-cv.png")
    if not os.path.exists(photo_file):
        photo_file = os.path.join(base_dir, "public", "images", "philippe.jpeg")
    
    out1 = os.path.join(base_dir, "public", "assets", "CV_Philippe_Hountondji.pdf")
    out2 = os.path.join(base_dir, "public", "CV_Philippe_Hountondji.pdf")

    os.makedirs(os.path.dirname(out1), exist_ok=True)

    generate_cv_pdf(out1, photo_file)
    generate_cv_pdf(out2, photo_file)
