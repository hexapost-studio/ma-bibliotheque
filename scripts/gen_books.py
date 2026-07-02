import json, hashlib

# domaine, [ (titleFr, titleEn, author, isbn13, price, reference, publicDomain) ]
DOMAINS = {
 "Philosophie": [
  ("Pensées pour moi-même","Meditations","Marc Aurèle","9780140449334",5.50,True,True),
  ("L'Étranger","The Stranger","Albert Camus","9780679720201",6.20,True,False),
  ("Ainsi parlait Zarathoustra","Thus Spoke Zarathustra","Friedrich Nietzsche","9780140441185",8.90,True,True),
  ("Lettres à Lucilius","Letters from a Stoic","Sénèque","9780140442106",9.40,True,True),
  ("Le Mythe de Sisyphe","The Myth of Sisyphus","Albert Camus","9780679733737",8.10,True,False),
 ],
 "Développement personnel": [
  ("Un rien peut tout changer","Atomic Habits","James Clear","9780735211292",12.90,True,False),
  ("Le Pouvoir du moment présent","The Power of Now","Eckhart Tolle","9781577314806",10.90,True,False),
  ("Les 7 habitudes","The 7 Habits of Highly Effective People","Stephen Covey","9781982137274",11.50,True,False),
  ("L'Alchimiste","The Alchemist","Paulo Coelho","9780061122415",7.90,True,False),
  ("Réfléchissez et devenez riche","Think and Grow Rich","Napoleon Hill","9781585424337",7.20,True,True),
 ],
 "Business & Finance": [
  ("Père riche, père pauvre","Rich Dad Poor Dad","Robert Kiyosaki","9781612680194",8.90,True,False),
  ("L'Investisseur intelligent","The Intelligent Investor","Benjamin Graham","9780060555665",14.90,True,False),
  ("Zero to One","Zero to One","Peter Thiel","9780804139298",13.20,True,False),
  ("La Semaine de 4 heures","The 4-Hour Workweek","Tim Ferriss","9780307465351",12.40,True,False),
 ],
 "Science & Nature": [
  ("Sapiens","Sapiens","Yuval Noah Harari","9780062316097",9.20,True,False),
  ("Une brève histoire du temps","A Brief History of Time","Stephen Hawking","9780553380163",10.50,True,False),
  ("Le Gène égoïste","The Selfish Gene","Richard Dawkins","9780198788607",11.90,True,False),
  ("L'Origine des espèces","On the Origin of Species","Charles Darwin","9780140439120",8.30,True,True),
 ],
 "Histoire": [
  ("Les Misérables","Les Misérables","Victor Hugo","9780451419439",11.50,True,True),
  ("Homo Deus","Homo Deus","Yuval Noah Harari","9781784703936",10.80,True,False),
  ("La Guerre des Gaules","The Gallic War","Jules César","9780199540266",9.10,True,True),
 ],
 "Psychologie": [
  ("Système 1 / Système 2","Thinking, Fast and Slow","Daniel Kahneman","9780374533557",13.90,True,False),
  ("Le Pouvoir des habitudes","The Power of Habit","Charles Duhigg","9780812981605",11.20,True,False),
  ("Découvrez vos points forts","Flow","Mihaly Csikszentmihalyi","9780061339202",12.10,True,False),
 ],
 "Fiction & Littérature": [
  ("Le Petit Prince","The Little Prince","Antoine de Saint-Exupéry","9780156012195",6.50,True,False),
  ("1984","Nineteen Eighty-Four","George Orwell","9780451524935",8.40,True,False),
  ("Crime et Châtiment","Crime and Punishment","Fiodor Dostoïevski","9780140449136",9.90,True,True),
  ("L'Odyssée","The Odyssey","Homère","9780140268867",10.20,True,True),
 ],
 "Science-Fiction & Fantasy": [
  ("Dune","Dune","Frank Herbert","9780441013593",9.90,True,False),
  ("Fondation","Foundation","Isaac Asimov","9780553293357",8.70,True,False),
  ("Le Meilleur des mondes","Brave New World","Aldous Huxley","9780060850524",8.20,True,False),
 ],
 "Spiritualité": [
  ("Siddhartha","Siddhartha","Hermann Hesse","9780553208849",6.80,True,True),
  ("Le Prophète","The Prophet","Khalil Gibran","9780394404288",7.40,True,True),
  ("L'Art de la guerre","The Art of War","Sun Tzu","9781599869773",5.20,True,True),
 ],
 "Informatique & Tech": [
  ("Clean Code","Clean Code","Robert C. Martin","9780132350884",34.90,True,False),
  ("Le Guide du codeur pragmatique","The Pragmatic Programmer","David Thomas","9780135957059",39.90,True,False),
  ("Structure et interprétation des programmes","SICP","Harold Abelson","9780262510875",42.50,True,True),
 ],
 "Langues & Curiosités": [
  ("Encyclopédie de la littérature en espéranto","A Concise Encyclopedia of the Original Literature of Esperanto","Geoffrey H. Sutton","9781595690906",114.29,True,False),
 ],
}

def hist(base, seed):
    h = int(hashlib.md5(seed.encode()).hexdigest(),16)
    pts=[]
    cur=base*1.18
    for i in range(12):
        h=(h*1103515245+12345)&0x7fffffff
        delta=((h%1000)/1000-0.45)*base*0.06
        cur=max(base*0.72, cur+delta)
        pts.append(round(cur,2))
    pts[-1]=base
    return pts

books=[]
palette=['#c96b3f','#3f5b52','#2f4a6b','#d8a13a','#7a2f2f','#4a4740','#6b5a3f','#8a5a6b','#b5623c','#2f5b4a','#3a3550','#9a6b2f']
txts=['#fff5ea','#eef5f0','#eaf1f8','#3a2c10','#f8eaea','#f2efe8','#f7f0e2','#f9edf1','#fdf1e6','#eaf5ef','#eeecf6','#fbf1df']
i=0
default_status={ "9780061122415":"lu","9780062316097":"lu","9780156012195":"lu","9780735211292":"en_cours",
 "9780451524935":"en_cours","9780441013593":"en_cours","9781577314806":"lu","9781585424337":"lu"}
default_rating={ "9780061122415":4,"9780062316097":5,"9780156012195":5,"9780735211292":4,"9780441013593":5,"9781577314806":3,"9781585424337":4}
for domain, arr in DOMAINS.items():
    for (fr,en,auth,isbn,price,ref,pd) in arr:
        i+=1
        books.append({
            "id":i,"titleFr":fr,"titleEn":en,"author":auth,"isbn":isbn,
            "domain":domain,"price":price,"priceHistory":hist(price,isbn),
            "reference":ref,"publicDomain":pd,
            "status":default_status.get(isbn,"souhait"),
            "rating":default_rating.get(isbn,0),
            "color":palette[i%len(palette)],"text":txts[i%len(txts)],
        })

ts="// AUTO-GÉNÉRÉ (script gen_books.py). Catalogue de référence par domaine.\n"
ts+="export type Status = 'souhait' | 'possede' | 'en_cours' | 'lu';\n"
ts+="""export interface Book {
  id: number; titleFr: string; titleEn: string; author: string; isbn: string;
  domain: string; price: number; priceHistory: number[];
  reference: boolean; publicDomain: boolean;
  status: Status; rating: number; color: string; text: string;
}
"""
ts+="export const DOMAINS: string[] = "+json.dumps(list(DOMAINS.keys()),ensure_ascii=False)+";\n\n"
ts+="export const BOOKS: Book[] = "+json.dumps(books,ensure_ascii=False,indent=2)+";\n"
open("src/data/books.ts","w").write(ts)
print("books:",len(books),"domains:",len(DOMAINS))
