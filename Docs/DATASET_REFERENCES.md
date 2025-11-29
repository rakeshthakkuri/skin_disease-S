# Skin Image Datasets Reference

This document provides information about the skin image datasets mentioned in the project documentation, including sample images and access links.

## Overview

The following datasets are recommended for skin disease classification, acne severity grading, and medical image analysis:

---

## 1. HAM10000 ("Human Against Machine with 10,000 images")

**Description:** Large collection of 10,015 dermatoscopic images with pigmented lesion types.

**Key Features:**
- 10,015 dermatoscopic images
- 7 classes of pigmented skin lesions
- High-quality dermoscopic images
- Widely used in dermatology AI research

**Access Links:**
- **Kaggle:** https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000
- **Harvard Dataverse (with detailed metadata):** https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi%3A10.7910%2FDVN%2FDBW86T

**Sample Images:**
*Note: Download the dataset to view sample images. The dataset includes images of:*
- Actinic keratoses and intraepithelial carcinoma
- Basal cell carcinoma
- Benign keratosis-like lesions
- Dermatofibroma
- Melanoma
- Melanocytic nevi
- Vascular lesions

**Usage in Project:**
- Training multi-class skin disease classification models
- Benchmarking model performance
- Comparative analysis with other datasets

---

## 2. Fitzpatrick 17k Dataset

**Description:** 16,577 clinical skin disease images with annotations including Fitzpatrick skin types.

**Key Features:**
- 16,577 clinical images
- Fitzpatrick skin type annotations (I-VI)
- Multi-class skin disease classification
- Used in multi-modal dermatology research

**Access:**
- Available through research publications
- Used in dermatology classification research

**Sample Images:**
*Note: Access through research channels. Includes diverse skin types and conditions.*

**Usage in Project:**
- Training models with diverse skin type representation
- Ensuring model fairness across different skin tones
- Multi-modal dermatology classification

---

## 3. DermNet Dataset

**Description:** Diverse, de-identified dataset of smartphone images with inflammatory skin conditions for AI innovation.

**Key Features:**
- Smartphone-captured images
- Inflammatory skin conditions
- De-identified patient data
- Real-world clinical scenarios

**Access Link:**
- **DermNet:** https://dermnetnz.org/dermatology-image-dataset

**Sample Images:**
*Note: Visit DermNet website to view sample images and access the dataset.*

**Usage in Project:**
- Training on real-world smartphone images
- Inflammatory skin condition classification
- Mobile dermatology applications

---

## 4. Skin Disease Variations Dataset

**Description:** Comprehensive dataset with segmented and synthetic images of multiple skin diseases, useful for classification tasks.

**Key Features:**
- Segmented images
- Synthetic variations
- Multiple skin diseases
- Classification-ready format

**Access Link:**
- **Kaggle:** https://www.kaggle.com/datasets/devdope/skin-disease-variations-dataset

**Sample Images:**
*Note: Download from Kaggle to view sample images. Includes variations and augmentations.*

**Usage in Project:**
- Data augmentation training
- Segmentation tasks
- Classification model training

---

## 5. SCIN (Skin Condition Image Network) Dataset

**Description:** Collection of representative dermatology images designed to bridge AI gaps.

**Key Features:**
- Representative dermatology images
- Designed for AI research
- Comprehensive coverage
- Research-focused dataset

**Access:**
- **GitHub:** https://github.com/google-research-datasets/scin

**Sample Images:**
*Note: Access through GitHub repository. Includes representative images of various skin conditions.*

**Usage in Project:**
- Research and development
- Model benchmarking
- Comprehensive skin condition coverage

---

## 6. Acne-Specific Image Datasets

### 6.1 Acne Dataset (Kaggle)

**Description:** Acne dataset with ~1,800 images (smaller, supplementary dataset).

**Key Features:**
- ~1,800 acne images
- Acne-specific classification
- Supplementary dataset

**Access Link:**
- **Kaggle:** https://www.kaggle.com/datasets/nayanchaure/acne-dataset

**Sample Images:**
*Note: Download from Kaggle to view sample images of various acne conditions.*

**Usage in Project:**
- Acne-specific model training
- Supplementary training data
- Acne severity classification

### 6.2 Acne Grading Classification Dataset

**Description:** Dataset with labels for acne severity grading.

**Key Features:**
- Acne severity labels
- Grading classification
- Severity-based annotations

**Access Link:**
- **Kaggle:** https://www.kaggle.com/datasets/rutviklathiyateksun/acne-grading-classificationdataset

**Sample Images:**
*Note: Download from Kaggle to view sample images with severity labels.*

**Usage in Project:**
- Acne severity grading
- Severity classification training
- Treatment recommendation systems

---

## 7. Bilingual Telugu-English Medical Domain Corpora

### 7.1 English-Telugu Medical Domain Parallel Corpus

**Description:** 50K+ sentence pairs for NLP and translation purposes in medical domain.

**Key Features:**
- 50,000+ sentence pairs
- Medical domain specific
- English-Telugu parallel corpus
- Translation training data

**Access Link:**
- **FutureBee AI:** https://www.futurebeeai.com/dataset/parallel-corpora/telugu-english-translated-parallel-corpus-for-medical-domain

**Usage in Project:**
- Bilingual prescription translation
- Medical term translation
- NLP model training

### 7.2 English-Telugu Education Domain Parallel Corpus

**Description:** 50K+ sentence pairs for education domain (supplementary).

**Key Features:**
- 50,000+ sentence pairs
- Education domain
- English-Telugu parallel corpus

**Access Link:**
- **FutureBee AI:** https://www.futurebeeai.com/dataset/parallel-corpora/telugu-english-translated-parallel-corpus-for-education-domain

**Usage in Project:**
- Supplementary translation training
- General domain translation
- NLP model enhancement

---

## Dataset Summary Table

| Dataset | Images | Type | Primary Use |
|---------|--------|------|-------------|
| HAM10000 | 10,015 | Dermoscopic | Multi-class classification |
| Fitzpatrick 17k | 16,577 | Clinical | Multi-class, skin type diversity |
| DermNet | Variable | Smartphone | Inflammatory conditions |
| Skin Disease Variations | Variable | Segmented/Synthetic | Classification, augmentation |
| SCIN | Variable | Clinical | Research, benchmarking |
| Acne Dataset (Kaggle) | ~1,800 | Acne-specific | Acne classification |
| Acne Grading | Variable | Acne severity | Severity grading |
| Telugu-English Medical | 50K+ pairs | Text corpus | Translation, NLP |

---

## How to Access Sample Images

### For Image Datasets:

1. **Kaggle Datasets:**
   - Create a Kaggle account
   - Navigate to the dataset page
   - Click "Download" or use Kaggle API
   - Extract and view sample images

2. **Research Datasets:**
   - Contact dataset authors
   - Follow citation requirements
   - Access through academic channels

3. **Public Repositories:**
   - Check GitHub repositories
   - Follow dataset license terms
   - Download and extract images

### For Text Corpora:

1. **FutureBee AI:**
   - Visit the website
   - Register/Login
   - Download parallel corpus
   - Extract sentence pairs

---

## Integration with Current Project

The current project uses a **custom dataset** (`dataset1/`) with 23 skin disease categories:

- **Training Images:** 15,557
- **Test Images:** 4,002
- **Total:** 19,559 images

The datasets listed above can be used to:
- **Augment training data** (especially HAM10000 and Fitzpatrick 17k)
- **Improve model generalization** (diverse skin types and conditions)
- **Enhance translation quality** (Telugu-English medical corpus)
- **Benchmark performance** (compare with published results)

---

## Notes

- All datasets should be used in accordance with their respective licenses
- Some datasets require academic/research access
- Always cite original dataset sources in publications
- Ensure proper data privacy and de-identification when using patient data
- The bilingual corpora are essential for Telugu prescription translation features

---

## References

1. Tschandl, P., et al. "The HAM10000 dataset, a large collection of multi-source dermatoscopic images of common pigmented skin lesions." Scientific data 5.1 (2018): 1-9.

2. Groh, M., et al. "Evaluating deep neural networks trained on clinical images in dermatology with the Fitzpatrick 17k dataset." Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition. 2021.

3. DermNet NZ. "Dermatology Image Dataset." https://dermnetnz.org/dermatology-image-dataset

4. FutureBee AI. "Telugu-English Medical Domain Parallel Corpus." https://www.futurebeeai.com/dataset/parallel-corpora/telugu-english-translated-parallel-corpus-for-medical-domain

---

*Last Updated: 2025*

