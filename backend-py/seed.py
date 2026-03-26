"""
Seed script for Escobita Simulator Platform.
Idempotent: checks for existing data before inserting.
"""
import sys
import os
import uuid
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.exam import Exam, ExamSection
from app.models.question import Question, QuestionOption
from app.core.security import hash_password


def make_id():
    return str(uuid.uuid4())


def seed_users(db):
    print("Seeding users...")
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            id=make_id(),
            username="admin",
            password_hash=hash_password("admin123"),
            email="admin@excoba.edu",
            name="Administrador Escobita",
            role="admin",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(admin)
        print("  Created user: admin")
    else:
        print("  User admin already exists, skipping")

    demo = db.query(User).filter(User.username == "demo").first()
    if not demo:
        demo = User(
            id=make_id(),
            username="demo",
            password_hash=hash_password("demo123"),
            email="demo@excoba.edu",
            name="Estudiante Demo",
            role="estudiante",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(demo)
        print("  Created user: demo")
    else:
        print("  User demo already exists, skipping")

    db.commit()
    print("Users seeded.")


def seed_exam(db):
    print("Seeding exam...")
    existing = db.query(Exam).filter(Exam.title == "Examen Escobita Demo").first()
    if existing:
        print("  Exam already exists, skipping exam seed")
        return existing

    exam = Exam(
        id=make_id(),
        title="Examen Escobita Demo",
        description="Examen de práctica para el Escobita — Evaluación de Competencias Básicas Académicas. Incluye secciones de Matemáticas, Español y Ciencias.",
        total_score=100.0,
        duration_minutes=120,
        is_published=True,
        calculator_enabled=True,
        navigation_type="free",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(exam)
    db.flush()
    print(f"  Created exam: {exam.title}")

    # Sections
    sections_data = [
        {"title": "Matemáticas", "instructions": "Lee cuidadosamente cada problema y selecciona la respuesta correcta. Puedes usar la calculadora.", "order_index": 0, "question_count": 10},
        {"title": "Español", "instructions": "Lee cada pregunta con atención. Selecciona la opción que mejor completa o responde cada ítem.", "order_index": 1, "question_count": 10},
        {"title": "Ciencias", "instructions": "Responde las preguntas sobre Biología, Química y Física. Usa tus conocimientos científicos.", "order_index": 2, "question_count": 10},
    ]

    sections = []
    for s_data in sections_data:
        section = ExamSection(
            id=make_id(),
            exam_id=exam.id,
            title=s_data["title"],
            instructions=s_data["instructions"],
            order_index=s_data["order_index"],
            question_count=s_data["question_count"],
        )
        db.add(section)
        sections.append(section)
        print(f"  Created section: {section.title}")

    db.flush()
    db.commit()
    return exam


def add_single_choice(db, exam_id, section_id, prompt, materia, tema, difficulty, order_index, options, correct_index, score=None):
    """Helper to add a single_choice question with 4 options."""
    q_score = score if score is not None else round(100.0 / 30, 4)
    q = Question(
        id=make_id(),
        exam_id=exam_id,
        section_id=section_id,
        materia=materia,
        tema=tema,
        difficulty=difficulty,
        order_index=order_index,
        type="single_choice",
        prompt=prompt,
        score=q_score,
        created_at=datetime.utcnow(),
    )
    db.add(q)
    db.flush()
    for i, (label, value) in enumerate(options):
        opt = QuestionOption(
            id=make_id(),
            question_id=q.id,
            label=label,
            value=value,
            is_correct=(i == correct_index),
            order_index=i,
        )
        db.add(opt)
    return q


def add_numeric(db, exam_id, section_id, prompt, materia, tema, difficulty, order_index, correct_value, score=None):
    """Helper to add a numeric question."""
    q_score = score if score is not None else round(100.0 / 30, 4)
    q = Question(
        id=make_id(),
        exam_id=exam_id,
        section_id=section_id,
        materia=materia,
        tema=tema,
        difficulty=difficulty,
        order_index=order_index,
        type="numeric",
        prompt=prompt,
        score=q_score,
        created_at=datetime.utcnow(),
    )
    db.add(q)
    db.flush()
    opt = QuestionOption(
        id=make_id(),
        question_id=q.id,
        label=str(correct_value),
        value=str(correct_value),
        is_correct=True,
        order_index=0,
    )
    db.add(opt)
    return q


def seed_questions(db, exam):
    print("Seeding questions...")

    existing_count = db.query(Question).filter(Question.exam_id == exam.id).count()
    if existing_count > 0:
        print(f"  Questions already exist ({existing_count}), skipping question seed")
        return

    sections = {s.title: s for s in db.query(ExamSection).filter(ExamSection.exam_id == exam.id).all()}
    mat_sec = sections["Matemáticas"]
    esp_sec = sections["Español"]
    cien_sec = sections["Ciencias"]

    # ---- MATEMÁTICAS: 8 single_choice + 2 numeric ----
    mat_questions = [
        {
            "type": "single_choice",
            "prompt": "¿Cuál es el resultado de la expresión: 3² + 4² ?",
            "tema": "Potencias",
            "difficulty": "facil",
            "options": [
                ("A) 14", "14"), ("B) 25", "25"), ("C) 7", "7"), ("D) 49", "49")
            ],
            "correct": 1,  # 25
        },
        {
            "type": "single_choice",
            "prompt": "Si f(x) = 2x + 5, ¿cuál es el valor de f(3)?",
            "tema": "Funciones lineales",
            "difficulty": "facil",
            "options": [
                ("A) 8", "8"), ("B) 11", "11"), ("C) 13", "13"), ("D) 16", "16")
            ],
            "correct": 1,  # 11
        },
        {
            "type": "single_choice",
            "prompt": "¿Cuál de los siguientes es un número primo?",
            "tema": "Números primos",
            "difficulty": "facil",
            "options": [
                ("A) 15", "15"), ("B) 21", "21"), ("C) 29", "29"), ("D) 33", "33")
            ],
            "correct": 2,  # 29
        },
        {
            "type": "single_choice",
            "prompt": "En un triángulo rectángulo, si los catetos miden 6 y 8 cm, ¿cuánto mide la hipotenusa?",
            "tema": "Teorema de Pitágoras",
            "difficulty": "medio",
            "options": [
                ("A) 10 cm", "10"), ("B) 12 cm", "12"), ("C) 14 cm", "14"), ("D) 7 cm", "7")
            ],
            "correct": 0,  # 10
        },
        {
            "type": "single_choice",
            "prompt": "¿Cuál es la solución del sistema de ecuaciones: 2x + y = 7  y  x - y = 2?",
            "tema": "Sistemas de ecuaciones",
            "difficulty": "medio",
            "options": [
                ("A) x=3, y=1", "x3y1"), ("B) x=2, y=3", "x2y3"), ("C) x=4, y=-1", "x4y-1"), ("D) x=1, y=5", "x1y5")
            ],
            "correct": 0,  # x=3, y=1
        },
        {
            "type": "single_choice",
            "prompt": "¿Cuál es el resultado de log₁₀(1000)?",
            "tema": "Logaritmos",
            "difficulty": "medio",
            "options": [
                ("A) 2", "2"), ("B) 3", "3"), ("C) 10", "10"), ("D) 100", "100")
            ],
            "correct": 1,  # 3
        },
        {
            "type": "single_choice",
            "prompt": "Si la probabilidad de que llueva mañana es 0.35, ¿cuál es la probabilidad de que NO llueva?",
            "tema": "Probabilidad",
            "difficulty": "facil",
            "options": [
                ("A) 0.35", "0.35"), ("B) 0.65", "0.65"), ("C) 0.50", "0.50"), ("D) 1.35", "1.35")
            ],
            "correct": 1,  # 0.65
        },
        {
            "type": "single_choice",
            "prompt": "¿Cuál es la derivada de f(x) = x³ - 3x² + 2x?",
            "tema": "Derivadas",
            "difficulty": "dificil",
            "options": [
                ("A) 3x² - 6x + 2", "3x2-6x+2"), ("B) x² - 6x + 2", "x2-6x+2"), ("C) 3x² - 3x + 2", "3x2-3x+2"), ("D) 3x³ - 6x + 2", "3x3-6x+2")
            ],
            "correct": 0,  # 3x² - 6x + 2
        },
    ]

    mat_numeric = [
        {
            "prompt": "¿Cuánto es la raíz cuadrada de 144?",
            "tema": "Raíces",
            "difficulty": "facil",
            "correct_value": 12,
        },
        {
            "prompt": "Si el perímetro de un cuadrado es 48 cm, ¿cuál es el área en cm²?",
            "tema": "Geometría plana",
            "difficulty": "medio",
            "correct_value": 144,
        },
    ]

    idx = 0
    for q_data in mat_questions:
        add_single_choice(
            db, exam.id, mat_sec.id,
            q_data["prompt"], "Matemáticas", q_data["tema"],
            q_data["difficulty"], idx, q_data["options"], q_data["correct"]
        )
        idx += 1

    for q_data in mat_numeric:
        add_numeric(
            db, exam.id, mat_sec.id,
            q_data["prompt"], "Matemáticas", q_data["tema"],
            q_data["difficulty"], idx, q_data["correct_value"]
        )
        idx += 1

    print(f"  Created {idx} Matemáticas questions")

    # ---- ESPAÑOL: 10 single_choice ----
    esp_questions = [
        {
            "prompt": "¿Cuál de las siguientes palabras está correctamente escrita?",
            "tema": "Ortografía",
            "difficulty": "facil",
            "options": [
                ("A) Haber", "Haber"), ("B) Haver", "Haver"), ("C) Aber", "Aber"), ("D) Avér", "Aver")
            ],
            "correct": 0,
        },
        {
            "prompt": "En la oración 'Los estudiantes estudiaron mucho', ¿cuál es el sujeto?",
            "tema": "Gramática",
            "difficulty": "facil",
            "options": [
                ("A) estudiaron", "estudiaron"), ("B) Los estudiantes", "Los estudiantes"), ("C) mucho", "mucho"), ("D) Los", "Los")
            ],
            "correct": 1,
        },
        {
            "prompt": "¿Qué figura retórica se usa en: 'Sus ojos son dos luceros brillantes'?",
            "tema": "Figuras retóricas",
            "difficulty": "medio",
            "options": [
                ("A) Metáfora", "Metáfora"), ("B) Hipérbole", "Hipérbole"), ("C) Anáfora", "Anáfora"), ("D) Aliteración", "Aliteración")
            ],
            "correct": 0,
        },
        {
            "prompt": "¿Cuál de las siguientes palabras lleva tilde (acento escrito)?",
            "tema": "Acentuación",
            "difficulty": "facil",
            "options": [
                ("A) Reloj", "Reloj"), ("B) Arbol", "Arbol"), ("C) Árbol", "Árbol"), ("D) Camion", "Camion")
            ],
            "correct": 2,
        },
        {
            "prompt": "¿Qué tipo de oración es: 'Cierra la puerta'?",
            "tema": "Tipos de oraciones",
            "difficulty": "medio",
            "options": [
                ("A) Exclamativa", "Exclamativa"), ("B) Imperativa", "Imperativa"), ("C) Interrogativa", "Interrogativa"), ("D) Enunciativa", "Enunciativa")
            ],
            "correct": 1,
        },
        {
            "prompt": "¿Cuál es el antónimo de 'generoso'?",
            "tema": "Vocabulario",
            "difficulty": "facil",
            "options": [
                ("A) Dadivoso", "Dadivoso"), ("B) Avaro", "Avaro"), ("C) Bondadoso", "Bondadoso"), ("D) Amable", "Amable")
            ],
            "correct": 1,
        },
        {
            "prompt": "En el texto: 'La luna sonreía entre las nubes'. ¿Qué recurso literario se emplea?",
            "tema": "Figuras retóricas",
            "difficulty": "medio",
            "options": [
                ("A) Comparación", "Comparacion"), ("B) Personificación", "Personificacion"), ("C) Onomatopeya", "Onomatopeya"), ("D) Hipérbole", "Hiperbole")
            ],
            "correct": 1,
        },
        {
            "prompt": "¿Cuál es el sinónimo más preciso de 'perspicaz'?",
            "tema": "Vocabulario",
            "difficulty": "dificil",
            "options": [
                ("A) Torpe", "Torpe"), ("B) Agudo", "Agudo"), ("C) Lento", "Lento"), ("D) Distraído", "Distraido")
            ],
            "correct": 1,
        },
        {
            "prompt": "¿Cuál de los siguientes enunciados usa correctamente el punto y coma?",
            "tema": "Puntuación",
            "difficulty": "dificil",
            "options": [
                ("A) Llegué tarde; porque me dormí.", "A"), ("B) Compré pan; leche; y fruta.", "B"), ("C) Estudia mucho; así aprobarás.", "C"), ("D) Me gusta el café; con leche.", "D")
            ],
            "correct": 2,
        },
        {
            "prompt": "¿Qué tiempo verbal se usa en: 'Mañana iré al mercado'?",
            "tema": "Tiempos verbales",
            "difficulty": "medio",
            "options": [
                ("A) Pretérito", "Preterito"), ("B) Presente", "Presente"), ("C) Futuro", "Futuro"), ("D) Condicional", "Condicional")
            ],
            "correct": 2,
        },
    ]

    idx = 0
    for q_data in esp_questions:
        add_single_choice(
            db, exam.id, esp_sec.id,
            q_data["prompt"], "Español", q_data["tema"],
            q_data["difficulty"], idx, q_data["options"], q_data["correct"]
        )
        idx += 1

    print(f"  Created {idx} Español questions")

    # ---- CIENCIAS: 8 single_choice + 2 numeric ----
    cien_questions = [
        {
            "prompt": "¿Cuál es el símbolo químico del oro?",
            "tema": "Química - Tabla periódica",
            "difficulty": "facil",
            "options": [
                ("A) Ag", "Ag"), ("B) Au", "Au"), ("C) Fe", "Fe"), ("D) Cu", "Cu")
            ],
            "correct": 1,
        },
        {
            "prompt": "¿Qué organelo celular es conocido como la 'central energética' de la célula?",
            "tema": "Biología - Célula",
            "difficulty": "facil",
            "options": [
                ("A) Ribosoma", "Ribosoma"), ("B) Vacuola", "Vacuola"), ("C) Mitocondria", "Mitocondria"), ("D) Núcleo", "Nucleo")
            ],
            "correct": 2,
        },
        {
            "prompt": "La Ley de Newton que enuncia: 'Todo cuerpo permanece en reposo o en movimiento rectilíneo uniforme a menos que una fuerza actúe sobre él' es la:",
            "tema": "Física - Leyes de Newton",
            "difficulty": "medio",
            "options": [
                ("A) Segunda Ley", "Segunda"), ("B) Tercera Ley", "Tercera"), ("C) Primera Ley", "Primera"), ("D) Ley de gravitación", "Gravitacion")
            ],
            "correct": 2,
        },
        {
            "prompt": "¿Cuántos cromosomas tiene una célula humana diploide normal?",
            "tema": "Biología - Genética",
            "difficulty": "medio",
            "options": [
                ("A) 23", "23"), ("B) 46", "46"), ("C) 48", "48"), ("D) 92", "92")
            ],
            "correct": 1,
        },
        {
            "prompt": "¿Cuál es la fórmula química del agua?",
            "tema": "Química - Compuestos",
            "difficulty": "facil",
            "options": [
                ("A) H₂O₂", "H2O2"), ("B) CO₂", "CO2"), ("C) H₂O", "H2O"), ("D) NaCl", "NaCl")
            ],
            "correct": 2,
        },
        {
            "prompt": "¿Qué proceso convierte la luz solar en energía química en las plantas?",
            "tema": "Biología - Fotosíntesis",
            "difficulty": "facil",
            "options": [
                ("A) Respiración celular", "Respiracion"), ("B) Fotosíntesis", "Fotosintesis"), ("C) Fermentación", "Fermentacion"), ("D) Digestión", "Digestion")
            ],
            "correct": 1,
        },
        {
            "prompt": "¿Cuál es la velocidad de la luz en el vacío aproximadamente?",
            "tema": "Física - Óptica",
            "difficulty": "medio",
            "options": [
                ("A) 300,000 km/s", "300000"), ("B) 3,000 km/s", "3000"), ("C) 30,000 km/s", "30000"), ("D) 3,000,000 km/s", "3000000")
            ],
            "correct": 0,
        },
        {
            "prompt": "¿Qué tipo de enlace se forma entre átomos de distinta electronegatividad que comparten electrones de manera desigual?",
            "tema": "Química - Enlace químico",
            "difficulty": "dificil",
            "options": [
                ("A) Enlace iónico", "Ionico"), ("B) Enlace covalente polar", "CovalentePolar"), ("C) Enlace metálico", "Metalico"), ("D) Enlace covalente apolar", "CovalenteApolar")
            ],
            "correct": 1,
        },
    ]

    cien_numeric = [
        {
            "prompt": "Si una solución tiene un pH de 7, ¿cuál es su concentración de iones H⁺ en mol/L? (Ingresa la potencia de 10, ej: si la respuesta es 10⁻⁷ escribe -7)",
            "tema": "Química - pH",
            "difficulty": "dificil",
            "correct_value": -7,
        },
        {
            "prompt": "Un objeto se deja caer desde una altura de 80 m. ¿Cuántos segundos tarda en llegar al suelo? (g = 10 m/s², resultado en segundos, redondea a 1 decimal)",
            "tema": "Física - Caída libre",
            "difficulty": "dificil",
            "correct_value": 4,
        },
    ]

    idx = 0
    for q_data in cien_questions:
        add_single_choice(
            db, exam.id, cien_sec.id,
            q_data["prompt"], "Ciencias", q_data["tema"],
            q_data["difficulty"], idx, q_data["options"], q_data["correct"]
        )
        idx += 1

    for q_data in cien_numeric:
        add_numeric(
            db, exam.id, cien_sec.id,
            q_data["prompt"], "Ciencias", q_data["tema"],
            q_data["difficulty"], idx, q_data["correct_value"]
        )
        idx += 1

    db.commit()
    print(f"  Created {idx} Ciencias questions")
    print("Questions seeded.")


def seed_bank_questions(db):
    """Create 20 bank questions (exam_id=None) for the generator."""
    print("Seeding bank questions...")
    existing = db.query(Question).filter(Question.exam_id.is_(None)).count()
    if existing > 0:
        print(f"  Bank questions already exist ({existing}), skipping")
        return

    bank_data = [
        # Matemáticas bank
        {"materia": "Matemáticas", "tema": "Álgebra", "difficulty": "facil", "prompt": "Simplifica la expresión: 3(x + 2) - 2(x - 1)", "options": [("A) x + 8", "x+8"), ("B) x + 4", "x+4"), ("C) 5x + 4", "5x+4"), ("D) x - 4", "x-4")], "correct": 0},
        {"materia": "Matemáticas", "tema": "Fracciones", "difficulty": "facil", "prompt": "¿Cuánto es 3/4 + 1/2?", "options": [("A) 4/6", "4/6"), ("B) 5/4", "5/4"), ("C) 4/8", "4/8"), ("D) 1", "1")], "correct": 1},
        {"materia": "Matemáticas", "tema": "Porcentajes", "difficulty": "medio", "prompt": "¿Cuánto es el 15% de 200?", "options": [("A) 25", "25"), ("B) 30", "30"), ("C) 35", "35"), ("D) 40", "40")], "correct": 1},
        {"materia": "Matemáticas", "tema": "Geometría", "difficulty": "medio", "prompt": "¿Cuál es el área de un círculo con radio 5 cm? (usa π ≈ 3.14)", "options": [("A) 78.5 cm²", "78.5"), ("B) 31.4 cm²", "31.4"), ("C) 25 cm²", "25"), ("D) 15.7 cm²", "15.7")], "correct": 0},
        {"materia": "Matemáticas", "tema": "Estadística", "difficulty": "medio", "prompt": "La media de los datos: 4, 8, 6, 10, 12 es:", "options": [("A) 7", "7"), ("B) 8", "8"), ("C) 9", "9"), ("D) 10", "10")], "correct": 1},
        {"materia": "Matemáticas", "tema": "Álgebra", "difficulty": "dificil", "prompt": "Resuelve: x² - 5x + 6 = 0", "options": [("A) x=2, x=3", "2,3"), ("B) x=1, x=6", "1,6"), ("C) x=-2, x=-3", "-2,-3"), ("D) x=5, x=1", "5,1")], "correct": 0},
        {"materia": "Matemáticas", "tema": "Trigonometría", "difficulty": "dificil", "prompt": "¿Cuál es el valor de sen(30°)?", "options": [("A) √3/2", "√3/2"), ("B) 1/2", "1/2"), ("C) √2/2", "√2/2"), ("D) 1", "1")], "correct": 1},
        # Español bank
        {"materia": "Español", "tema": "Ortografía", "difficulty": "facil", "prompt": "¿Cuál de las siguientes palabras usa correctamente la 'b'?", "options": [("A) Volver", "Volver"), ("B) Beber", "Beber"), ("C) Vevida", "Vevida"), ("D) Bolver", "Bolver")], "correct": 1},
        {"materia": "Español", "tema": "Comprensión lectora", "difficulty": "medio", "prompt": "¿Cuál es el propósito principal de un texto argumentativo?", "options": [("A) Entretener al lector", "Entretener"), ("B) Informar sin opinión", "Informar"), ("C) Convencer al lector de una idea", "Convencer"), ("D) Narrar una historia", "Narrar")], "correct": 2},
        {"materia": "Español", "tema": "Literatura", "difficulty": "medio", "prompt": "¿A qué género literario pertenece una novela?", "options": [("A) Lírico", "Lirico"), ("B) Dramático", "Dramatico"), ("C) Narrativo", "Narrativo"), ("D) Didáctico", "Didactico")], "correct": 2},
        {"materia": "Español", "tema": "Gramática", "difficulty": "dificil", "prompt": "¿Qué función cumple el gerundio en: 'Llegando a casa, encendió la televisión'?", "options": [("A) Sujeto", "Sujeto"), ("B) Complemento circunstancial de tiempo", "CCTiempo"), ("C) Predicado nominal", "Predicado"), ("D) Objeto directo", "OD")], "correct": 1},
        {"materia": "Español", "tema": "Semántica", "difficulty": "facil", "prompt": "¿Cuál es el significado de la palabra 'efímero'?", "options": [("A) Duradero", "Duradero"), ("B) Pasajero, de corta duración", "Pasajero"), ("C) Eterno", "Eterno"), ("D) Resistente", "Resistente")], "correct": 1},
        # Ciencias bank
        {"materia": "Ciencias", "tema": "Biología - Evolución", "difficulty": "medio", "prompt": "¿Quién propuso la teoría de la evolución por selección natural?", "options": [("A) Gregor Mendel", "Mendel"), ("B) Louis Pasteur", "Pasteur"), ("C) Charles Darwin", "Darwin"), ("D) Isaac Newton", "Newton")], "correct": 2},
        {"materia": "Ciencias", "tema": "Química - Reacciones", "difficulty": "medio", "prompt": "¿Qué tipo de reacción ocurre cuando el hierro se oxida?", "options": [("A) Síntesis", "Sintesis"), ("B) Combustión", "Combustion"), ("C) Oxidación", "Oxidacion"), ("D) Neutralización", "Neutralizacion")], "correct": 2},
        {"materia": "Ciencias", "tema": "Física - Energía", "difficulty": "facil", "prompt": "¿Cuál es la unidad de medida de la energía en el Sistema Internacional?", "options": [("A) Watt", "Watt"), ("B) Newton", "Newton"), ("C) Joule", "Joule"), ("D) Pascal", "Pascal")], "correct": 2},
        {"materia": "Ciencias", "tema": "Biología - Ecología", "difficulty": "facil", "prompt": "¿Cuál de los siguientes es un ejemplo de productor en una cadena alimenticia?", "options": [("A) León", "Leon"), ("B) Hierba", "Hierba"), ("C) Conejo", "Conejo"), ("D) Águila", "Aguila")], "correct": 1},
        {"materia": "Ciencias", "tema": "Química - Ácidos y bases", "difficulty": "medio", "prompt": "¿Qué indica un pH menor a 7?", "options": [("A) Solución básica", "Basica"), ("B) Solución neutra", "Neutra"), ("C) Solución ácida", "Acida"), ("D) Solución saturada", "Saturada")], "correct": 2},
        {"materia": "Ciencias", "tema": "Física - Termodinámica", "difficulty": "dificil", "prompt": "¿Cuál es la ley de la termodinámica que establece que la energía no se crea ni se destruye?", "options": [("A) Segunda Ley", "Segunda"), ("B) Ley Cero", "LeyZero"), ("C) Primera Ley", "Primera"), ("D) Tercera Ley", "Tercera")], "correct": 2},
        {"materia": "Ciencias", "tema": "Biología - Genética", "difficulty": "dificil", "prompt": "¿Cuál es el nombre de las estructuras que contienen la información genética en el núcleo celular?", "options": [("A) Ribosomas", "Ribosomas"), ("B) Mitocondrias", "Mitocondrias"), ("C) Cromosomas", "Cromosomas"), ("D) Vacuolas", "Vacuolas")], "correct": 2},
        {"materia": "Matemáticas", "tema": "Secuencias", "difficulty": "facil", "prompt": "En la secuencia 2, 4, 8, 16, ¿cuál es el siguiente número?", "options": [("A) 24", "24"), ("B) 32", "32"), ("C) 20", "20"), ("D) 36", "36")], "correct": 1},
    ]

    count = 0
    for q_data in bank_data:
        q = Question(
            id=make_id(),
            exam_id=None,
            section_id=None,
            materia=q_data["materia"],
            tema=q_data["tema"],
            difficulty=q_data["difficulty"],
            order_index=count,
            type="single_choice",
            prompt=q_data["prompt"],
            score=1.0,
            created_at=datetime.utcnow(),
        )
        db.add(q)
        db.flush()
        for i, (label, value) in enumerate(q_data["options"]):
            opt = QuestionOption(
                id=make_id(),
                question_id=q.id,
                label=label,
                value=value,
                is_correct=(i == q_data["correct"]),
                order_index=i,
            )
            db.add(opt)
        count += 1

    db.commit()
    print(f"  Created {count} bank questions")


def main():
    db = SessionLocal()
    try:
        try:
            seed_users(db)
        except Exception as e:
            print(f"ERROR seeding users: {e}")
            db.rollback()

        exam = None
        try:
            exam = seed_exam(db)
        except Exception as e:
            print(f"ERROR seeding exam: {e}")
            db.rollback()

        if exam:
            try:
                seed_questions(db, exam)
            except Exception as e:
                print(f"ERROR seeding questions: {e}")
                db.rollback()

        try:
            seed_bank_questions(db)
        except Exception as e:
            print(f"ERROR seeding bank questions: {e}")
            db.rollback()

        print("\nSeed completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
