# CheFu Academy Python Client

Official Python source client for the CheFu Academy API.

## Usage

### CLI

```bash
pipx install chefu-academy
chefu-academy login
chefu-academy keys create --name "Local development"
chefu-academy keys list
chefu-academy keys revoke <key-id>
```

If you install inside a virtual environment, use:

```bash
pip install chefu-academy
chefu-academy auth
```

### Client

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
