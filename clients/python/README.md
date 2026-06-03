# CheFu Academy Python Client

Official Python source client for the CheFu Academy API.

## Usage

```python
from chefu_academy import CheFuAcademy

client = CheFuAcademy(api_key="chf_publicId_secret")
courses = client.courses.list(limit=5)
print(courses["courses"])
```

## Local Install

```bash
pip install -e clients/python
```
