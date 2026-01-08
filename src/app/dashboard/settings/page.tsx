'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [mailSetting, setMailSetting] = useState({
    email: '',
    isActive: true,
  });
  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch user mail setting
      const mailRes = await fetch('/api/settings/mail');
      if (mailRes.ok) {
        const mailData = await mailRes.json();
        if (mailData) {
          setMailSetting({
            email: mailData.email || '',
            isActive: mailData.isActive ?? true,
          });
        }
      }

      // Fetch SMTP settings (admin only)
      if (session?.user?.isAdmin) {
        const smtpRes = await fetch('/api/settings/smtp');
        if (smtpRes.ok) {
          const smtpData = await smtpRes.json();
          setSmtpSettings(smtpData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleMailSettingSave = async () => {
    try {
      const res = await fetch('/api/settings/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mailSetting),
      });

      if (!res.ok) throw new Error();

      toast({ title: '성공', description: '메일 설정이 저장되었습니다.' });
    } catch (error) {
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleSmtpSettingsSave = async () => {
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings),
      });

      if (!res.ok) throw new Error();

      toast({ title: '성공', description: 'SMTP 설정이 저장되었습니다.' });
    } catch (error) {
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleTestMail = async () => {
    if (!testEmail) {
      toast({ title: '오류', description: '테스트 메일 주소를 입력하세요.', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/settings/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to send test email');
      }

      toast({ title: '성공', description: '테스트 메일이 발송되었습니다.' });
    } catch (error: any) {
      toast({ title: '오류', description: error.message || '테스트 메일 발송에 실패했습니다.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-500 mt-1">알림 및 시스템 설정을 관리하세요</p>
      </div>

      <Tabs defaultValue="mail" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mail" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            메일 알림
          </TabsTrigger>
          {session?.user?.isAdmin && (
            <TabsTrigger value="smtp" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              SMTP 설정
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="mail">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                메일 알림 설정
              </CardTitle>
              <CardDescription>
                매일 오전 9시에 처리해야 할 전표와 만료 임박 계약 알림을 받으세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={mailSetting.isActive}
                    onCheckedChange={(checked) => setMailSetting({ ...mailSetting, isActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    메일 알림 받기
                  </Label>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">수신 메일 주소</Label>
                  <Input
                    id="email"
                    type="email"
                    value={mailSetting.email}
                    onChange={(e) => setMailSetting({ ...mailSetting, email: e.target.value })}
                    placeholder="알림을 받을 이메일 주소를 입력하세요"
                  />
                </div>

                <Button onClick={handleMailSettingSave} className="bg-blue-600 hover:bg-blue-700">
                  저장
                </Button>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">알림 규칙</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>전표: 해당 월의 미처리 전표 목록</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>계약: 만료 45일, 30일, 20일, 10일, 3일, 2일, 1일 전 알림</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>처리 완료된 전표는 알림에서 제외됩니다</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {session?.user?.isAdmin && (
          <TabsContent value="smtp">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  SMTP 서버 설정
                </CardTitle>
                <CardDescription>
                  메일 발송을 위한 SMTP 서버 정보를 설정하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smtp_host">SMTP 서버</Label>
                      <Input
                        id="smtp_host"
                        value={smtpSettings.smtp_host}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })}
                        placeholder="mail.example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="smtp_port">포트</Label>
                      <Input
                        id="smtp_port"
                        value={smtpSettings.smtp_port}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_port: e.target.value })}
                        placeholder="25"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smtp_user">사용자 ID</Label>
                      <Input
                        id="smtp_user"
                        value={smtpSettings.smtp_user}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_user: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="smtp_pass">비밀번호</Label>
                      <Input
                        id="smtp_pass"
                        type="password"
                        value={smtpSettings.smtp_pass}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_pass: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtp_from">발신자 주소</Label>
                    <Input
                      id="smtp_from"
                      type="email"
                      value={smtpSettings.smtp_from}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_from: e.target.value })}
                      placeholder="noreply@example.com"
                    />
                  </div>

                  <Button onClick={handleSmtpSettingsSave} className="bg-blue-600 hover:bg-blue-700 w-fit">
                    저장
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">테스트 메일 발송</h4>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="테스트 메일 주소"
                      className="max-w-xs"
                    />
                    <Button
                      onClick={handleTestMail}
                      disabled={sending}
                      variant="outline"
                    >
                      {sending ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          발송 중...
                        </div>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          테스트 발송
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
